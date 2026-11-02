/// <reference lib="webworker" />

declare const CACHE: string;
declare const EDITION: string;
declare const BASE: string;
declare const FILES: string[];
declare const INTEGRITY: Record<string, string>;
declare const SIZES: Record<string, number>;
const workshop = self as unknown as ServiceWorkerGlobalScope;
let ownActive = workshop.registration.active;
let repair: Promise<void> | undefined;
let inspection: Promise<{ complete: boolean; missing: number; corrupt: number }> | undefined;
const progressPorts = new Set<MessagePort>();
const idleMs = 20000;
const progressUrl = `${BASE}.offline-progress`;

async function announce(type: string) {
  for (const client of await workshop.clients.matchAll())
    client.postMessage({ type, edition: EDITION });
}
async function matches(bytes: Uint8Array<ArrayBuffer>, url: string): Promise<boolean> {
  if (bytes.byteLength !== SIZES[url]) return false;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return `sha256-${btoa(String.fromCharCode(...digest))}` === INTEGRITY[url];
}
async function cached(url: string): Promise<Response | undefined> {
  // CacheStorage.match is read-only, even if activation deleted this cache.
  const response = await caches.match(url, { cacheName: CACHE });
  if (!response) return;
  if (await matches(new Uint8Array(await response.clone().arrayBuffer()), url)) return response;
}
async function inspect() {
  if (inspection) return inspection;
  const job = (async () => {
    let missing = 0,
      corrupt = 0;
    await concurrent(FILES, async (url) => {
      const response = await caches.match(url, { cacheName: CACHE });
      if (!response) missing++;
      else if (!(await matches(new Uint8Array(await response.arrayBuffer()), url))) corrupt++;
    });
    return { complete: missing === 0 && corrupt === 0, missing, corrupt };
  })();
  inspection = job;
  try {
    return await job;
  } finally {
    if (inspection === job) inspection = undefined;
  }
}
async function concurrent<T>(items: readonly T[], action: (item: T) => Promise<void>, limit = 4) {
  let index = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (index < items.length) {
        const item = items[index++];
        if (item !== undefined) await action(item);
      }
    }),
  );
}

/** Deadlines measure silence, not the duration of an actively transferring scan. */
async function network(url: string, signal?: AbortSignal, progress?: (bytes: number) => void) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = (milliseconds = idleMs) => {
    clearTimeout(timer);
    timer = setTimeout(
      () => controller.abort(new DOMException("The saved file stopped arriving.", "TimeoutError")),
      milliseconds,
    );
  };
  arm(60000);
  try {
    // Request.integrity can buffer an entire response before fetch resolves.
    // Check our inventory explicitly so a long active body is not a header timeout.
    const response = await fetch(url, { cache: "reload", signal: controller.signal });
    if (!response.ok) throw new Error(`Offline file returned HTTP ${response.status}.`);
    const chunks: Uint8Array[] = [];
    let count = 0;
    const reader = response.body?.getReader();
    if (reader)
      while (true) {
        arm();
        const part = await reader.read();
        if (part.done) break;
        count += part.value.byteLength;
        if (count > (SIZES[url] ?? -1)) {
          controller.abort();
          throw new Error("Offline file exceeds its edition size.");
        }
        chunks.push(part.value);
        progress?.(part.value.byteLength);
      }
    clearTimeout(timer);
    const bytes = new Uint8Array(count);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    if (!(await matches(bytes, url))) throw new Error("Offline file does not match this edition.");
    return new Response(bytes, { status: 200, headers: response.headers });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
async function store(url: string, response: Response, installing = false) {
  if (
    !installing &&
    (workshop.registration.active !== ownActive || ownActive?.state === "redundant")
  )
    throw new Error("This worker has been replaced.");
  const cache = await caches.open(CACHE);
  await cache.put(url, response);
}
async function fill(installing: boolean) {
  const controller = new AbortController();
  const previousProgress = await caches
    .match(progressUrl, { cacheName: CACHE })
    .then((response) => response?.json())
    .catch(() => undefined);
  let persisted =
    previousProgress?.edition === EDITION && Number.isInteger(previousProgress.verified)
      ? previousProgress.verified
      : 0;
  let marker = Promise.resolve();
  let finished = 0,
    bytes = 0,
    lastProgress = 0;
  const progress = (n = 0) => {
    bytes += n;
    const now = Date.now();
    if (n && now - lastProgress < 1000) return;
    lastProgress = now;
    for (const port of progressPorts)
      port.postMessage({
        type: "GONIA_PROGRESS",
        edition: EDITION,
        finished,
        total: FILES.length,
        bytes,
      });
  };
  try {
    // Start large files early so a native lifetime limit interrupts small
    // remaining reads. Two background requests leave room for foreground
    // sources and fonts under the browser's per-origin connection limit.
    const order = [...FILES].sort((a, b) => (SIZES[b] ?? 0) - (SIZES[a] ?? 0));
    await concurrent(
      order,
      async (url) => {
        controller.signal.throwIfAborted();
        if (!(await cached(url))) {
          const response = await network(url, controller.signal, progress);
          await store(url, response, installing);
        }
        finished++;
        if (finished > persisted) {
          const verified = finished;
          persisted = verified;
          marker = marker
            .then(() =>
              store(
                progressUrl,
                new Response(JSON.stringify({ edition: EDITION, verified }), {
                  headers: { "Content-Type": "application/json" },
                }),
                installing,
              ),
            )
            .catch(() => {});
          await marker;
        }
        progress();
      },
      2,
    );
  } catch (error) {
    controller.abort(error);
    throw error;
  }
}

workshop.addEventListener("install", (event) => {
  event.waitUntil(
    fill(true).then(async () => {
      if (!(await inspect()).complete)
        throw new Error("The complete offline edition was not retained.");
      await workshop.skipWaiting();
    }),
  );
});
workshop.addEventListener("activate", (event) => {
  ownActive = workshop.registration.active;
  event.waitUntil(
    (async () => {
      await Promise.all(
        (await caches.keys())
          .filter((key) => key.startsWith("gonia-") && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await workshop.clients.claim();
      await announce("GONIA_CACHE_CHANGED");
    })(),
  );
});
workshop.addEventListener("message", (event) => {
  if (event.data?.type === "GONIA_ACTIVATE") {
    event.waitUntil(workshop.skipWaiting());
    return;
  }
  const port = event.ports[0];
  if (!port || !["GONIA_INSPECT", "GONIA_REPAIR"].includes(event.data?.type)) return;
  event.waitUntil(
    (async () => {
      try {
        if (event.data.type === "GONIA_REPAIR") {
          if (event.data.edition !== EDITION)
            throw new Error("A different edition is open. Reload before repairing it.");
          progressPorts.add(port);
          if (!repair) {
            const job = fill(false);
            repair = job;
            void job
              .finally(() => {
                if (repair === job) repair = undefined;
              })
              .catch(() => {});
          }
          await repair;
          await announce("GONIA_CACHE_CHANGED");
        }
        const result = await inspect();
        port.postMessage({
          type: "GONIA_EDITION",
          edition: EDITION,
          busy: Boolean(repair),
          ...result,
        });
        if (!result.complete) await announce("GONIA_CACHE_DAMAGED");
      } catch (error) {
        port.postMessage({
          type: "GONIA_EDITION",
          edition: EDITION,
          complete: false,
          error: error instanceof Error ? error.message : "Offline files could not be checked.",
        });
        await announce("GONIA_CACHE_DAMAGED");
      } finally {
        progressPorts.delete(port);
      }
    })(),
  );
});

async function asset(url: string) {
  const saved = await cached(url);
  if (saved) return saved;
  await announce("GONIA_CACHE_DAMAGED");
  const response = await network(url);
  await store(url, response.clone());
  await announce("GONIA_CACHE_CHANGED");
  return response;
}
async function navigation(url: string): Promise<Response> {
  const saved = await cached(url);
  const controller = new AbortController();
  // A verified saved page remains usable during server errors, maintenance
  // bodies and stalled responses. Without a saved copy, allow an active read.
  const timer = saved ? setTimeout(() => controller.abort(), 2000) : undefined;
  try {
    return await network(url, controller.signal);
  } catch {
    if (saved) return saved;
    await announce("GONIA_CACHE_DAMAGED");
    return new Response(
      `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gonia — saved page unavailable</title><h1>This saved page is unavailable.</h1><p>Reconnect and reload to recover it, or return to a saved workshop and choose Repair offline files.</p><p><a href="${BASE}">Return to Gonia</a></p></html>`,
      { status: 503, headers: { "Content-Type": "text/html;charset=utf-8" } },
    );
  } finally {
    clearTimeout(timer);
  }
}
workshop.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== workshop.location.origin ||
    !url.pathname.startsWith(BASE)
  )
    return;
  const file = url.pathname === BASE ? `${BASE}index.html` : url.pathname;
  if (!FILES.includes(file)) return;
  event.respondWith(
    event.request.mode === "navigate"
      ? navigation(file)
      : asset(file).catch(() => Response.error()),
  );
});
