"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function PublishNowButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    // /api/publish-now is an authenticated proxy that adds the cron secret server-side.
    const res = await fetch("/api/publish-now", { method: "POST" });
    const json = await res.json() as { published?: number; failed?: number; error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(`❌ ${json.error ?? "Failed"}`);
    } else {
      setMsg(`✅ Published: ${json.published ?? 0}  Failed: ${json.failed ?? 0}`);
    }
    router.refresh();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}
      <button onClick={run} disabled={busy} className="good" style={{ whiteSpace: "nowrap" }}>
        {busy ? "Publishing…" : "⚡ Publish now"}
      </button>
    </div>
  );
}
