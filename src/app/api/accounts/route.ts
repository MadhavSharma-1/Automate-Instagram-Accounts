import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  username: z.string().min(1),
  igUserId: z.string().min(1),
  accessToken: z.string().min(1),
  dailyLimit: z.coerce.number().int().min(1).max(50).default(3),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const account = await prisma.instagramAccount.create({ data: parsed.data });
  return NextResponse.json(account, { status: 201 });
}

export async function GET() {
  const accounts = await prisma.instagramAccount.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(accounts);
}
