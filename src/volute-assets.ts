import manifest from "../public/sources/volute/manifest.json";

export const VOLUTE_ASSETS: Record<string, { bytes: number; sha256: string }> = {
  ...Object.fromEntries(manifest.pages.map((p) => [`sources/volute/${p.file}`, p])),
  ...manifest.relatedAssets,
};
const pending = new Map<string, Promise<Uint8Array<ArrayBuffer>>>();
export function voluteAsset(path: string): Promise<Uint8Array<ArrayBuffer>> {
  const existing = pending.get(path);
  if (existing) return existing;
  const expected = VOLUTE_ASSETS[path];
  if (!expected) return Promise.reject(new Error("This file has no retained source identity."));
  const promise = (async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}${path}`, {
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok)
      throw new Error(`Could not read source (${response.status}). Reconnect and try again.`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const sha = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    if (bytes.length !== expected.bytes || sha !== expected.sha256)
      throw new Error(
        "The source file does not match this edition. Reload online before trying again.",
      );
    return bytes;
  })();
  pending.set(path, promise);
  void promise.catch(() => {
    if (pending.get(path) === promise) pending.delete(path);
  });
  return promise;
}
export function voluteData(bytes: Uint8Array, mime: string): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16384)
    binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return `data:${mime};base64,${btoa(binary)}`;
}
