import { NextResponse } from "next/server";
import { runDuePublishes } from "@/lib/scheduler";

// Serverless-friendly publish trigger. Point a cron (e.g. Vercel Cron) at this
// route, or run the standalone worker (`npm run worker`) instead.
// Protect with a shared secret header to avoid public triggering.
export async function POST(req: Request) {
  const secret = process.env.ADMIN_PASSWORD;
  if (secret && req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runDuePublishes();
  return NextResponse.json(result);
}
