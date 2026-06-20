import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// Approve / reject / edit a pending post from the approval queue.
const schema = z.object({
  action: z.enum(["approve", "reject"]).optional(),
  caption: z.string().optional(), // allow editing the caption before approving
  scheduledFor: z.string().datetime().nullish(),
});

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.post.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { action, caption, scheduledFor } = parsed.data;

  const data: Record<string, unknown> = {};
  if (caption !== undefined) data.caption = caption;
  if (scheduledFor !== undefined) data.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
  if (action === "approve") data.status = "APPROVED";
  if (action === "reject") data.status = "REJECTED";

  const post = await prisma.post.update({ where: { id: params.id }, data });
  return NextResponse.json(post);
}
