import type { FetchParams, NormalizedProduct, ProductSourceAdapter } from "./types";

/**
 * Temu affiliate adapter.
 *
 * Temu runs its affiliate program both directly and through networks (e.g. CJ,
 * Awin). Plug your program's product-feed/link-generation endpoint in here. If
 * you join via a network, you may prefer a generic "network feed" adapter
 * instead — the interface is identical.
 */
export class TemuAdapter implements ProductSourceAdapter {
  readonly kind = "temu";

  async fetchProducts(_params: FetchParams): Promise<NormalizedProduct[]> {
    if (!process.env.TEMU_AFFILIATE_KEY) {
      throw new Error("Temu not configured. Set TEMU_AFFILIATE_KEY (or use a network-feed adapter).");
    }
    // INTEGRATION POINT: call your Temu/affiliate-network product feed, map to
    // NormalizedProduct, and ensure affiliateUrl carries your tracking id.
    void (_params as FetchParams);
    throw new Error("Temu product feed not wired yet. Implement TemuAdapter.fetchProducts().");
  }
}
