import type { FetchParams, NormalizedProduct, ProductSourceAdapter } from "./types";

/**
 * Manual adapter — for products entered by hand in the admin panel.
 *
 * Lets you start posting today without any affiliate API keys: paste the buy
 * link + title + image URLs, optionally with your own affiliate tag already in
 * the URL. `fetchProducts` is a no-op (manual products are created via the UI).
 */
export class ManualAdapter implements ProductSourceAdapter {
  readonly kind = "manual";

  async fetchProducts(_params: FetchParams): Promise<NormalizedProduct[]> {
    return []; // manual products are inserted directly, not fetched
  }

  async fetchByUrl(url: string): Promise<NormalizedProduct> {
    // Best-effort: we keep the pasted URL as the affiliate link verbatim.
    // (Open-graph extraction can be added here later if desired.)
    const u = new URL(url);
    return {
      externalId: `${u.hostname}${u.pathname}`,
      title: "Untitled product (edit me)",
      imageUrls: [],
      affiliateUrl: url,
      raw: { url },
    };
  }
}
