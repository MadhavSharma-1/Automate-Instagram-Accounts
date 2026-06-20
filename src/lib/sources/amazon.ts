import type { FetchParams, NormalizedProduct, ProductSourceAdapter } from "./types";
import { signPaApiRequest } from "./amazon-signer";

// Amazon Product Advertising API (PA-API 5.0) adapter.
// Docs: https://webservices.amazon.com/paapi5/documentation/search-items.html
//
// Required env vars:
//   AMAZON_PAAPI_ACCESS_KEY   from Associates → Tools → Product Advertising API
//   AMAZON_PAAPI_SECRET_KEY
//   AMAZON_PARTNER_TAG        your Associates tracking id (e.g. "mybrand-20")
//   AMAZON_PAAPI_HOST         default: webservices.amazon.com (US)
//   AMAZON_PAAPI_REGION       default: us-east-1
//
// Source config fields (stored in ProductSource.config):
//   keywords     string   e.g. "wireless earbuds"
//   searchIndex  string   e.g. "Electronics", "All" (default)
//   minRating    number   filter out items below this star rating (optional)

const RESOURCES = [
  "Images.Primary.Large",
  "Images.Variants.Large",
  "ItemInfo.Title",
  "ItemInfo.Features",
  "ItemInfo.ProductInfo",
  "Offers.Listings.Price",
  "Offers.Listings.DeliveryInfo.IsPrimeEligible",
];

export class AmazonAdapter implements ProductSourceAdapter {
  readonly kind = "amazon";

  private creds() {
    return {
      accessKey: process.env.AMAZON_PAAPI_ACCESS_KEY ?? "",
      secretKey: process.env.AMAZON_PAAPI_SECRET_KEY ?? "",
      partnerTag: process.env.AMAZON_PARTNER_TAG ?? "",
      host: process.env.AMAZON_PAAPI_HOST ?? "webservices.amazon.com",
      region: process.env.AMAZON_PAAPI_REGION ?? "us-east-1",
    };
  }

  private assertConfigured() {
    const c = this.creds();
    if (!c.accessKey || !c.secretKey || !c.partnerTag) {
      throw new Error(
        "Amazon PA-API not configured. Set AMAZON_PAAPI_ACCESS_KEY, AMAZON_PAAPI_SECRET_KEY, AMAZON_PARTNER_TAG in your .env."
      );
    }
  }

  async fetchProducts(params: FetchParams): Promise<NormalizedProduct[]> {
    this.assertConfigured();
    const keywords = String(params.config.keywords ?? "").trim() || "best sellers";
    const searchIndex = String(params.config.searchIndex ?? "All");
    const minRating = Number(params.config.minRating ?? 0);
    const count = Math.min(params.limit, 10); // PA-API max is 10 per request

    const items = await this.searchItems({ keywords, searchIndex, count });

    return items
      .filter((i) => {
        if (!minRating) return true;
        const rating = (i as unknown as { CustomerReviews?: { StarRating?: { Value?: number } } })
          .CustomerReviews?.StarRating?.Value;
        return !rating || rating >= minRating;
      })
      .map((i) => this.normalize(i));
  }

  private async searchItems(args: {
    keywords: string;
    searchIndex: string;
    count: number;
  }): Promise<PaapiItem[]> {
    const c = this.creds();
    const path = "/paapi5/searchitems";
    const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";

    const body = JSON.stringify({
      Keywords: args.keywords,
      SearchIndex: args.searchIndex,
      ItemCount: args.count,
      PartnerTag: c.partnerTag,
      PartnerType: "Associates",
      Resources: RESOURCES,
    });

    const headers = signPaApiRequest({
      host: c.host,
      region: c.region,
      path,
      target,
      payload: body,
      accessKey: c.accessKey,
      secretKey: c.secretKey,
    });

    const res = await fetch(`https://${c.host}${path}`, {
      method: "POST",
      headers: { ...headers, "content-length": String(Buffer.byteLength(body, "utf8")) },
      body,
    });

    const json = (await res.json()) as PaapiResponse;

    if (!res.ok) {
      const errMsg = json.Errors?.map((e) => `${e.Code}: ${e.Message}`).join("; ") ?? res.statusText;
      throw new Error(`PA-API SearchItems failed: ${errMsg}`);
    }

    return json.SearchResult?.Items ?? [];
  }

  private normalize(item: PaapiItem): NormalizedProduct {
    const images: string[] = [];
    if (item.Images?.Primary?.Large?.URL) images.push(item.Images.Primary.Large.URL);
    for (const v of item.Images?.Variants ?? []) {
      if (v.Large?.URL) images.push(v.Large.URL);
    }

    return {
      externalId: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue ?? "Untitled product",
      description: item.ItemInfo?.Features?.DisplayValues?.join("\n"),
      priceText: item.Offers?.Listings?.[0]?.Price?.DisplayAmount,
      imageUrls: images,
      // DetailPageURL from PA-API already has your PartnerTag embedded.
      affiliateUrl: item.DetailPageURL,
      raw: item as unknown as Record<string, unknown>,
    };
  }
}

// PA-API response types (minimal subset we use).
interface PaapiResponse {
  SearchResult?: { Items?: PaapiItem[] };
  Errors?: Array<{ Code: string; Message: string }>;
}

interface PaapiItem {
  ASIN: string;
  DetailPageURL: string;
  ItemInfo?: {
    Title?: { DisplayValue?: string };
    Features?: { DisplayValues?: string[] };
  };
  Images?: {
    Primary?: { Large?: { URL?: string } };
    Variants?: Array<{ Large?: { URL?: string } }>;
  };
  Offers?: { Listings?: Array<{ Price?: { DisplayAmount?: string } }> };
}
