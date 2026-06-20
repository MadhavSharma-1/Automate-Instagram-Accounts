import { NextResponse } from "next/server";
import { runDuePublishes } from "@/lib/scheduler";

// Admin-only shortcut: trigger publishing immediately without waiting for cron.
// Protected by the same session middleware that guards the whole admin panel.
export async function POST() {
  const result = await runDuePublishes();
  return NextResponse.json(result);
}
