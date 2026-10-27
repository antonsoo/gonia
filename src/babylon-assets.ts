import manifest from "../public/sources/babylon/manifest.json";

const pending = new Map<string, Promise<Uint8Array<ArrayBuffer>>>();
export const BABYLON_ASSETS = Object.fromEntries([
  ...Object.entries(manifest.files).map(([name, value]) => [`sources/babylon/${name}`, value]),
  ...Object.entries(manifest.relatedAssets),
]);
export function babylonAsset(path: string): Promise<Uint8Array<ArrayBuffer>> {
  const prior = pending.get(path);
  if (prior) return prior;
  const promise = (async () => {
    const expected = BABYLON_ASSETS[path];
    if (!expected) throw new Error("This source has no retained identity.");
    const response = await fetch(`${import.meta.env.BASE_URL}${path}`, {
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Source request failed (${response.status}).`);
    const data = new Uint8Array(await response.arrayBuffer());
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data)), (v) =>
      v.toString(16).padStart(2, "0"),
    ).join("");
    if (data.byteLength !== expected.bytes || hash !== expected.sha256)
      throw new Error(
        "This source does not match the retained edition. Reconnect and reload before saving.",
      );
    return data;
  })();
  pending.set(path, promise);
  void promise.catch(() => {
    if (pending.get(path) === promise) pending.delete(path);
  });
  return promise;
}
export async function babylonData(path: string, type: string): Promise<string> {
  const data = await babylonAsset(path);
  let text = "";
  for (let i = 0; i < data.length; i += 16384)
    text += String.fromCharCode(...data.subarray(i, i + 16384));
  return `data:${type};base64,${btoa(text)}`;
}
