import manifest from "../public/sources/volute/manifest.json";
import { retainedAssetReader } from "./retained-asset-reader";

export const VOLUTE_ASSETS: Record<string, { bytes: number; sha256: string }> = {
  ...Object.fromEntries(manifest.pages.map((p) => [`sources/volute/${p.file}`, p])),
  ...manifest.relatedAssets,
};
export const voluteAsset = retainedAssetReader(VOLUTE_ASSETS);

export function voluteData(bytes: Uint8Array, mime: string): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16384)
    binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return `data:${mime};base64,${btoa(binary)}`;
}
