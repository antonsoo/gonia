type EditionReply = {
  type: string;
  edition: string;
  complete?: boolean;
  busy?: boolean;
  finished?: number;
  total?: number;
  error?: string;
};

export async function offlineStatus(element: HTMLElement) {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    element.textContent = "Development preview";
    return;
  }
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Check offline files";
  button.disabled = true;
  button.className = "offline-check";
  element.insertAdjacentElement("afterend", button);
  let registration: ServiceWorkerRegistration;
  let listening = false,
    resuming = false,
    lastFailureProgress = 0;
  let inspection = 0,
    failed = false,
    repairing = false;
  let action: "check" | "repair" | "reload" | "retry" = "check";
  const pending = () => Boolean(registration?.installing || registration?.waiting);
  const choose = (next: typeof action) => {
    action = next;
    button.textContent =
      next === "repair"
        ? "Repair offline files"
        : next === "reload"
          ? "Reload workshop"
          : next === "retry"
            ? "Retry offline download"
            : "Check offline files";
  };
  const damaged = () => {
    inspection++;
    element.textContent =
      "Saved files are missing or damaged. Reconnect and repair them before going offline.";
    choose("repair");
    button.disabled = false;
  };
  function request(worker: ServiceWorker, type: "GONIA_INSPECT" | "GONIA_REPAIR", attempt: number) {
    const channel = new MessageChannel();
    let timer: ReturnType<typeof setTimeout>;
    const reply = new Promise<EditionReply>((resolve, reject) => {
      const arm = () => {
        clearTimeout(timer);
        timer = setTimeout(
          () => reject(new Error("The offline check stopped responding. Reconnect and try again.")),
          type === "GONIA_REPAIR" ? 45000 : 20000,
        );
      };
      arm();
      channel.port1.onmessage = (event: MessageEvent<EditionReply>) => {
        const data = event.data;
        if (data.type === "GONIA_PROGRESS") {
          arm();
          if (attempt === inspection && data.edition === __GONIA_EDITION__)
            element.textContent = `Repairing offline files: ${data.finished} of ${data.total} checked…`;
        } else if (data.type === "GONIA_EDITION") resolve(data);
      };
      worker.postMessage({ type, edition: __GONIA_EDITION__ }, [channel.port2]);
    });
    return reply.finally(() => {
      clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
    });
  }
  const inspect = async (fix = false) => {
    if (repairing || resuming) return;
    const attempt = ++inspection;
    button.disabled = true;
    if (pending()) {
      element.textContent = registration.active
        ? "Downloading the updated workshop & sources…"
        : "Downloading workshop & sources for offline use…";
      return;
    }
    const worker = navigator.serviceWorker.controller;
    if (!worker || worker !== registration.active || worker.state !== "activated") {
      element.textContent = failed
        ? "Offline download unavailable; workshop still works online"
        : "Finishing the offline installation…";
      if (failed) choose("retry");
      button.disabled = !failed;
      return;
    }
    repairing = fix;
    element.textContent = fix
      ? "Checking and repairing saved workshop files…"
      : "Checking saved workshop files…";
    try {
      const saved = await request(worker, fix ? "GONIA_REPAIR" : "GONIA_INSPECT", attempt);
      if (attempt !== inspection || worker !== navigator.serviceWorker.controller) return;
      if (saved.edition !== __GONIA_EDITION__) {
        element.textContent = failed
          ? "Offline update incomplete. Reconnect and retry the download."
          : "A different offline edition is saved. Reload to open it.";
        choose(failed ? "retry" : "reload");
      } else if (saved.complete && !saved.busy) {
        element.textContent = "Workshop & source saved offline";
        choose("check");
      } else if (saved.busy) {
        element.textContent = "Repairing saved workshop files…";
        choose("check");
      } else {
        element.textContent = saved.error
          ? `Offline repair incomplete. ${saved.error} Reconnect and try again.`
          : "Saved files are missing or damaged. Reconnect and repair them before going offline.";
        choose("repair");
      }
    } catch (error) {
      if (attempt === inspection) {
        element.textContent =
          error instanceof Error
            ? error.message
            : "Offline files could not be checked. Reconnect and try again.";
        choose("repair");
      }
    } finally {
      if (attempt === inspection) {
        repairing = false;
        button.disabled = false;
      }
    }
  };
  // A native worker lifetime limit can interrupt a long installation even
  // while files keep arriving. Resume only when verified-file progress grew;
  // a persistent bad response therefore cannot create an automatic retry loop.
  const resume = async () => {
    if (resuming || !navigator.onLine) return false;
    const response = await caches.match(`${import.meta.env.BASE_URL}.offline-progress`, {
      cacheName: `gonia-${__GONIA_EDITION__}`,
    });
    const progress = await response?.json().catch(() => undefined);
    if (
      progress?.edition !== __GONIA_EDITION__ ||
      !Number.isInteger(progress.verified) ||
      progress.verified <= lastFailureProgress
    )
      return false;
    lastFailureProgress = progress.verified;
    resuming = true;
    inspection++;
    element.textContent = "Continuing the offline download from verified saved files…";
    button.disabled = true;
    try {
      await connect();
    } catch {
      failed = true;
    } finally {
      resuming = false;
      watch();
    }
    return true;
  };
  const watched = new WeakSet<ServiceWorker>();
  const registrations = new WeakSet<ServiceWorkerRegistration>();
  const watch = () => {
    if (
      !registration.installing &&
      !registration.waiting &&
      !registration.active &&
      !navigator.serviceWorker.controller
    )
      failed = true;
    for (const worker of [
      registration.installing,
      registration.waiting,
      registration.active,
      navigator.serviceWorker.controller,
    ]) {
      if (!worker) continue;
      if (worker.state === "installed") worker.postMessage({ type: "GONIA_ACTIVATE" });
      if (watched.has(worker)) continue;
      watched.add(worker);
      let activated = worker.state === "activated";
      if (worker === registration.installing) failed = false;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") worker.postMessage({ type: "GONIA_ACTIVATE" });
        if (worker.state === "activated") activated = true;
        if (worker.state === "redundant" && !activated) {
          failed = true;
          void resume()
            .then((resumed) => {
              if (!resumed) void inspect();
            })
            .catch(() => inspect());
          return;
        }
        void inspect();
      });
    }
    void inspect();
  };
  button.addEventListener("click", () => {
    if (action === "reload") {
      location.reload();
      return;
    }
    if (action === "retry" || failed) {
      button.disabled = true;
      void connect();
      return;
    }
    void inspect(action === "repair");
  });
  const connect = async () => {
    try {
      registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
      if (!registrations.has(registration)) {
        registrations.add(registration);
        registration.addEventListener("updatefound", watch);
      }
      if (!listening) {
        listening = true;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          repairing = false;
          watch();
        });
        navigator.serviceWorker.addEventListener("message", (event: MessageEvent<EditionReply>) => {
          if (
            event.source !== navigator.serviceWorker.controller ||
            event.data.edition !== __GONIA_EDITION__
          )
            return;
          if (event.data.type === "GONIA_CACHE_DAMAGED" && !repairing) damaged();
          if (event.data.type === "GONIA_CACHE_CHANGED" && !repairing) void inspect();
        });
        window.addEventListener("focus", () => {
          void inspect();
        });
        window.addEventListener("pageshow", () => {
          void inspect();
        });
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") void inspect();
        });
        window.addEventListener("online", () => {
          void connect();
        });
        setInterval(() => {
          if (document.visibilityState === "visible") void inspect();
        }, 30000);
      }
      watch();
    } catch {
      element.textContent = "Offline download unavailable. Reconnect and retry the download.";
      choose("retry");
      button.disabled = false;
    }
  };
  await connect();
}
