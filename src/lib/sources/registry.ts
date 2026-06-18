import { AliExpressAdapter } from "./aliexpress";
import { AmazonAdapter } from "./amazon";
import { ManualAdapter } from "./manual";
import { TemuAdapter } from "./temu";
import type { ProductSourceAdapter } from "./types";

// Single place that maps ProductSource.kind -> adapter instance.
const adapters: Record<string, ProductSourceAdapter> = {};
for (const a of [new AmazonAdapter(), new AliExpressAdapter(), new TemuAdapter(), new ManualAdapter()]) {
  adapters[a.kind] = a;
}

export function getAdapter(kind: string): ProductSourceAdapter {
  const a = adapters[kind];
  if (!a) throw new Error(`Unknown product source kind: ${kind}`);
  return a;
}

export const SUPPORTED_SOURCE_KINDS = Object.keys(adapters);
