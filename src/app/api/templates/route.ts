import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1),
  kind: z.enum(["caption", "script"]).default("caption"),
  body: z.string().min(1),
  isDefault: z.boolean().default(false),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  // Only one default per kind.
  if (d.isDefault) {
    await prisma.promptTemplate.updateMany({ where: { kind: d.kind, isDefault: true }, data: { isDefault: false } });
  }
  const t = await prisma.promptTemplate.create({ data: d });
  return NextResponse.json(t, { status: 201 });
}
