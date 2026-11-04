import manifest from "../public/sources/arch/manifest.json";
import { retainedAssetReader } from "./retained-asset-reader";

const identities: Record<string, { bytes: number; sha256: string }> = {
  ...Object.fromEntries(manifest.pages.map((p) => [`sources/arch/${p.file}`, p])),
  ...manifest.relatedAssets,
};
export const archAsset = retainedAssetReader(identities);

export function archData(bytes: Uint8Array, mime: string): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16384)
    binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return `data:${mime};base64,${btoa(binary)}`;
}
