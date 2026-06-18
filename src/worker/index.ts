// Standalone publisher loop. Run with: npm run worker
// (In production you'd use a real cron / queue; this is a simple poller.)
import { runDuePublishes } from "../lib/scheduler";

const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS ?? 60_000);

async function tick() {
  try {
    const result = await runDuePublishes();
    if (result.published || result.failed) {
      console.log(`[worker] published=${result.published} failed=${result.failed}`);
    }
  } catch (err) {
    console.error("[worker] tick error:", err);
  }
}

console.log(`[worker] starting; polling every ${INTERVAL_MS}ms`);
void tick();
setInterval(tick, INTERVAL_MS);
