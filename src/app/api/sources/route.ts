import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { SUPPORTED_SOURCE_KINDS } from "@/lib/sources/registry";

const schema = z.object({
  kind: z.enum(SUPPORTED_SOURCE_KINDS as [string, ...string[]]),
  label: z.string().min(1),
  config: z.record(z.unknown()).default({}),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const source = await prisma.productSource.create({
    data: { kind: parsed.data.kind, label: parsed.data.label, config: parsed.data.config as object },
  });
  return NextResponse.json(source, { status: 201 });
}
