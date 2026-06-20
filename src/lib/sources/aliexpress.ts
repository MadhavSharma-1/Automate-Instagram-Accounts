import type { FetchParams, NormalizedProduct, ProductSourceAdapter } from "./types";

/**
 * AliExpress Affiliate / Open Platform adapter.
 *
 * Uses the affiliate API (aliexpress.affiliate.product.query /
 * aliexpress.affiliate.link.generate) which returns product data and a
 * tracking link tied to your TrackingId. Compliant alternative to scraping.
 *
 * Docs: https://openservice.aliexpress.com/
 */
export class AliExpressAdapter implements ProductSourceAdapter {
  readonly kind = "aliexpress";

  private assertConfigured() {
    if (!process.env.ALIEXPRESS_APP_KEY || !process.env.ALIEXPRESS_APP_SECRET) {
      throw new Error(
        "AliExpress not configured. Set ALIEXPRESS_APP_KEY, ALIEXPRESS_APP_SECRET, ALIEXPRESS_TRACKING_ID."
      );
    }
  }

  async fetchProducts(params: FetchParams): Promise<NormalizedProduct[]> {
    this.assertConfigured();
    // INTEGRATION POINT: signed call to aliexpress.affiliate.product.query with
    // { keywords, category_ids, page_size, tracking_id }. Map results below.
    void params;
    throw new Error(
      "AliExpress affiliate.product.query not wired yet. Implement signed request in AliExpressAdapter.fetchProducts()."
    );
  }

  /** Maps a raw affiliate product record into our normalized shape. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private normalize(p: AliProduct): NormalizedProduct {
    return {
      externalId: String(p.product_id),
      title: p.product_title,
      description: undefined,
      priceText: p.target_sale_price ? `${p.target_sale_price} ${p.target_sale_price_currency ?? ""}`.trim() : undefined,
      imageUrls: [p.product_main_image_url, ...(p.product_small_image_urls?.string ?? [])].filter(Boolean),
      affiliateUrl: p.promotion_link, // tracking link from the affiliate API
      raw: p as unknown as Record<string, unknown>,
    };
  }
}

interface AliProduct {
  product_id: number | string;
  product_title: string;
  target_sale_price?: string;
  target_sale_price_currency?: string;
  product_main_image_url: string;
  product_small_image_urls?: { string: string[] };
  promotion_link: string;
}
