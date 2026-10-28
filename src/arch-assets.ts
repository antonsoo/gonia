import manifest from "../public/sources/arch/manifest.json";

const identities: Record<string, { bytes: number; sha256: string }> = {
  ...Object.fromEntries(manifest.pages.map((p) => [`sources/arch/${p.file}`, p])),
  ...manifest.relatedAssets,
};
const pending = new Map<string, Promise<Uint8Array<ArrayBuffer>>>();
export function archAsset(path: string): Promise<Uint8Array<ArrayBuffer>> {
  const saved = pending.get(path);
  if (saved) return saved;
  const expected = identities[path];
  if (!expected) return Promise.reject(new Error("This file has no retained identity."));
  const job = (async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}${path}`, {
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok)
      throw new Error(`Could not read the source (${response.status}). Reconnect and try again.`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (v) =>
      v.toString(16).padStart(2, "0"),
    ).join("");
    if (bytes.length !== expected.bytes || digest !== expected.sha256)
      throw new Error("The source does not match this edition. Reload online before trying again.");
    return bytes;
  })();
  pending.set(path, job);
  void job.catch(() => {
    if (pending.get(path) === job) pending.delete(path);
  });
  return job;
}
export function archData(bytes: Uint8Array, mime: string): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16384)
    binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return `data:${mime};base64,${btoa(binary)}`;
}
