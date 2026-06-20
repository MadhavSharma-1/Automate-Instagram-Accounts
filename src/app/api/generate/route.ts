import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generatePostForProduct } from "@/lib/pipeline";

// Generate a post (render video + caption) for a product → PENDING_APPROVAL.
const schema = z.object({
  accountId: z.string().min(1),
  productId: z.string().min(1),
  templateId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  isHighlight: z.boolean().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const template = d.templateId
    ? await prisma.promptTemplate.findUnique({ where: { id: d.templateId } })
    : await prisma.promptTemplate.findFirst({ where: { kind: "caption", isDefault: true } });

  const captionTemplate =
    template?.body ??
    "Write a fun, honest unboxing-style caption for {{title}} ({{price}}). Highlight: {{features}}. Add a clear CTA to the link {{link}}. Include 8-12 relevant hashtags.";

  try {
    const post = await generatePostForProduct({
      accountId: d.accountId,
      productId: d.productId,
      captionTemplate,
      scheduledFor: d.scheduledFor ? new Date(d.scheduledFor) : undefined,
      isHighlight: d.isHighlight,
    });
    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
