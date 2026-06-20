import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// Create a product manually (paste-a-link flow). For affiliate-API sources,
// products are ingested by the source adapters instead.
const schema = z.object({
  sourceId: z.string().min(1),
  title: z.string().min(1),
  affiliateUrl: z.string().url(),
  description: z.string().optional(),
  priceText: z.string().optional(),
  imageUrls: z.array(z.string().url()).default([]),
  externalId: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const product = await prisma.product.create({
    data: {
      sourceId: d.sourceId,
      externalId: d.externalId ?? new URL(d.affiliateUrl).pathname,
      title: d.title,
      description: d.description,
      priceText: d.priceText,
      imageUrls: d.imageUrls,
      affiliateUrl: d.affiliateUrl,
    },
  });
  return NextResponse.json(product, { status: 201 });
}
