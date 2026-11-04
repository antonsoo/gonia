export function retainedAssetReader(identities: Record<string, { bytes: number; sha256: string }>) {
  const verified = new Map<string, Uint8Array<ArrayBuffer>>();

  /** Each cancellable consumer owns its request; verified successes can be reused. */
  return function retainedAsset(
    path: string,
    signal?: AbortSignal,
  ): Promise<Uint8Array<ArrayBuffer>> {
    if (signal?.aborted) return Promise.reject(signal.reason);
    const expected = identities[path];
    if (!expected) return Promise.reject(new Error("This file has no retained identity."));
    const bytes = verified.get(path);
    if (bytes) return Promise.resolve(bytes);
    const job = readRetainedAsset(path, expected, signal).then((bytes) => {
      verified.set(path, bytes);
      return bytes;
    });
    return job;
  };
}

async function readRetainedAsset(
  path: string,
  expected: { bytes: number; sha256: string },
  signal?: AbortSignal,
): Promise<Uint8Array<ArrayBuffer>> {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = () =>
    controller.abort(
      new DOMException(
        "The source stopped arriving. Reconnect and retry the source or reading.",
        "TimeoutError",
      ),
    );
  let idle = setTimeout(timeout, 60000);
  const total = setTimeout(
    () =>
      controller.abort(
        new DOMException(
          "The source exceeded the three-minute reading limit. Reconnect and retry.",
          "TimeoutError",
        ),
      ),
    180000,
  );
  let reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>> | undefined;
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}${path}`, {
      signal: controller.signal,
      // Firefox needs the normal request path to reach a saved worker response
      // while offline. Cold readers have no worker and own uncached channels.
      cache: navigator.serviceWorker?.controller ? "default" : "no-store",
    });
    if (!response.ok)
      throw new Error(`Could not read the source (${response.status}). Reconnect and try again.`);
    reader = response.body?.getReader();
    if (!reader) throw new Error("The source response has no readable body. Reconnect and retry.");
    const bytes = new Uint8Array(expected.bytes);
    let at = 0;
    while (true) {
      clearTimeout(idle);
      idle = setTimeout(timeout, 20000);
      const part = await reader.read();
      if (part.done) break;
      // Refuse extra bytes before copying or buffering an oversized response.
      if (at + part.value.byteLength > expected.bytes)
        throw new Error(
          "The source exceeds this edition's recorded size. Reload online before trying again.",
        );
      bytes.set(part.value, at);
      at += part.value.byteLength;
    }
    clearTimeout(idle);
    if (at !== expected.bytes)
      throw new Error("The source ended before this edition's recorded size. Reconnect and retry.");
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (v) =>
      v.toString(16).padStart(2, "0"),
    ).join("");
    controller.signal.throwIfAborted();
    if (digest !== expected.sha256)
      throw new Error("The source does not match this edition. Reload online before trying again.");
    return bytes;
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason;
    if (error instanceof TypeError)
      throw new Error(
        "The source connection was interrupted. Reconnect and retry the source or reading.",
      );
    throw error;
  } finally {
    clearTimeout(idle);
    clearTimeout(total);
    signal?.removeEventListener("abort", abort);
    await reader?.cancel().catch(() => {});
    reader?.releaseLock();
  }
}
