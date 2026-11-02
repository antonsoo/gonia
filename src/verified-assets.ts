export type AssetReadOptions = {
  signal?: AbortSignal;
  progress?: (finished: number, total: number) => void;
};

/** Verify a bounded group of source files, retaining no failed/pending memo. */
export async function verifiedAssets(
  inventory: Record<string, string>,
  options: AssetReadOptions = {},
): Promise<Map<string, Uint8Array<ArrayBuffer>>> {
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  const entries = Object.entries(inventory),
    result = new Map<string, Uint8Array<ArrayBuffer>>();
  let index = 0;
  try {
    await Promise.all(
      Array.from({ length: Math.min(2, entries.length) }, async () => {
        while (index < entries.length) {
          controller.signal.throwIfAborted();
          const item = entries[index++];
          if (!item) return;
          const [path, expected] = item;
          const bytes = await read(path, controller.signal);
          const actual = Array.from(
            new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
            (b) => b.toString(16).padStart(2, "0"),
          ).join("");
          controller.signal.throwIfAborted();
          if (actual !== expected)
            throw new Error(`This edition could not verify ${path}. Reload online before saving.`);
          result.set(path, bytes);
          options.progress?.(result.size, entries.length);
        }
      }),
    );
    return result;
  } catch (error) {
    controller.abort(error);
    throw error;
  } finally {
    options.signal?.removeEventListener("abort", abort);
  }
}
async function read(path: string, signal: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  if (signal.aborted) abort();
  else signal.addEventListener("abort", abort, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = (milliseconds = 20000) => {
    clearTimeout(timer);
    timer = setTimeout(
      () =>
        controller.abort(
          new DOMException(
            "The source stopped arriving. Reconnect and try saving again.",
            "TimeoutError",
          ),
        ),
      milliseconds,
    );
  };
  arm(60000);
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}${path}`, {
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(
        `Could not load ${path} (HTTP ${response.status}). Reconnect and try saving again.`,
      );
    const reader = response.body?.getReader(),
      chunks: Uint8Array[] = [];
    let size = 0;
    if (reader)
      while (true) {
        arm();
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 32 * 1024 * 1024)
          throw new Error("The source exceeds the study's 32 MiB file limit.");
        chunks.push(chunk.value);
      }
    const bytes = new Uint8Array(size);
    let at = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, at);
      at += chunk.byteLength;
    }
    return bytes;
  } catch (error) {
    controller.abort(error);
    throw controller.signal.reason;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}
