import type { FetchParams, NormalizedProduct, ProductSourceAdapter } from "./types";

/**
 * Amazon Product Advertising API (PA-API 5.0) adapter.
 *
 * Requires an approved Amazon Associates account + PA-API keys. PA-API returns
 * product data AND lets you build a tracking URL via your PartnerTag, so this is
 * the compliant alternative to scraping amazon.com.
 *
 * Docs: https://webservices.amazon.com/paapi5/documentation/
 *
 * NOTE: PA-API requests must be SigV4-signed. The signing is intentionally left
 * as a clearly-marked integration point so you can drop in the official SDK or a
 * small signer once your keys are provisioned. Until then this throws a helpful
 * error instead of silently doing nothing.
 */
export class AmazonAdapter implements ProductSourceAdapter {
  readonly kind = "amazon";

  private get creds() {
    return {
      accessKey: process.env.AMAZON_PAAPI_ACCESS_KEY,
      secretKey: process.env.AMAZON_PAAPI_SECRET_KEY,
      partnerTag: process.env.AMAZON_PARTNER_TAG,
      host: process.env.AMAZON_PAAPI_HOST ?? "webservices.amazon.com",
      region: process.env.AMAZON_PAAPI_REGION ?? "us-east-1",
    };
  }

  private assertConfigured() {
    const { accessKey, secretKey, partnerTag } = this.creds;
    if (!accessKey || !secretKey || !partnerTag) {
      throw new Error(
        "Amazon PA-API not configured. Set AMAZON_PAAPI_ACCESS_KEY, AMAZON_PAAPI_SECRET_KEY, AMAZON_PARTNER_TAG."
      );
    }
  }

  async fetchProducts(params: FetchParams): Promise<NormalizedProduct[]> {
    this.assertConfigured();
    const keywords = String((params.config.keywords as string) ?? "").trim();
    const searchIndex = (params.config.searchIndex as string) ?? "All";

    // INTEGRATION POINT: call PA-API SearchItems (SigV4-signed POST to
    // https://{host}/paapi5/searchitems) with { Keywords, SearchIndex, ItemCount,
    // PartnerTag, Resources: [Images, ItemInfo, Offers] }, then map below.
    const items = await this.searchItems({ keywords, searchIndex, count: params.limit });
    return items.map((i) => this.normalize(i));
  }

  // Placeholder that documents the expected PA-API response shape.
  private async searchItems(_args: {
    keywords: string;
    searchIndex: string;
    count: number;
  }): Promise<PaapiItem[]> {
    throw new Error(
      "Amazon PA-API SearchItems not wired yet. Implement SigV4-signed request in AmazonAdapter.searchItems()."
    );
  }

  private normalize(item: PaapiItem): NormalizedProduct {
    return {
      externalId: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue ?? "Untitled product",
      description: item.ItemInfo?.Features?.DisplayValues?.join("\n"),
      priceText: item.Offers?.Listings?.[0]?.Price?.DisplayAmount,
      imageUrls: [item.Images?.Primary?.Large?.URL].filter(Boolean) as string[],
      // PA-API DetailPageURL already includes your PartnerTag → it's the affiliate link.
      affiliateUrl: item.DetailPageURL,
      raw: item as unknown as Record<string, unknown>,
    };
  }
}

// Minimal subset of the PA-API item shape we consume.
interface PaapiItem {
  ASIN: string;
  DetailPageURL: string;
  ItemInfo?: {
    Title?: { DisplayValue?: string };
    Features?: { DisplayValues?: string[] };
  };
  Images?: { Primary?: { Large?: { URL?: string } } };
  Offers?: { Listings?: Array<{ Price?: { DisplayAmount?: string } }> };
}
