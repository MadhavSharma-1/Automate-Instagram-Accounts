import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdapter } from "@/lib/sources/registry";

// Trigger a product fetch for a source and upsert results into the DB.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const source = await prisma.productSource.findUnique({ where: { id: params.id } });
  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });
  if (!source.enabled) return NextResponse.json({ error: "Source is disabled" }, { status: 400 });

  const adapter = getAdapter(source.kind);
  const products = await adapter.fetchProducts({
    config: source.config as Record<string, unknown>,
    limit: 10,
  });

  // Upsert so re-fetching the same source doesn't create duplicates.
  let saved = 0;
  for (const p of products) {
    await prisma.product.upsert({
      where: { sourceId_externalId: { sourceId: source.id, externalId: p.externalId } },
      create: {
        sourceId: source.id,
        externalId: p.externalId,
        title: p.title,
        description: p.description,
        priceText: p.priceText,
        imageUrls: p.imageUrls,
        affiliateUrl: p.affiliateUrl,
        raw: p.raw as object,
      },
      update: {
        title: p.title,
        description: p.description,
        priceText: p.priceText,
        imageUrls: p.imageUrls,
        affiliateUrl: p.affiliateUrl,
        raw: p.raw as object,
      },
    });
    saved++;
  }

  return NextResponse.json({ fetched: products.length, saved });
}
