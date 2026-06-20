// Normalized product shape that every source adapter must produce.
// This is the contract the rest of the app depends on — add a new affiliate
// source by implementing `ProductSourceAdapter`, nothing else needs to change.

export interface NormalizedProduct {
  externalId: string; // ASIN / item id / sku
  title: string;
  description?: string;
  priceText?: string;
  imageUrls: string[];
  /** Affiliate/tracking buy link that goes in the caption. */
  affiliateUrl: string;
  /** Raw payload kept for debugging / future fields. */
  raw: Record<string, unknown>;
}

export interface FetchParams {
  /** Source-specific config row (categories, keywords, min rating, ...). */
  config: Record<string, unknown>;
  /** Max items to return this run. */
  limit: number;
}

export interface ProductSourceAdapter {
  /** Stable identifier matching ProductSource.kind. */
  readonly kind: string;
  /** Pull a batch of products to consider for posting. */
  fetchProducts(params: FetchParams): Promise<NormalizedProduct[]>;
  /** Resolve a single pasted product URL (manual flow / enrichment). */
  fetchByUrl?(url: string): Promise<NormalizedProduct>;
}
