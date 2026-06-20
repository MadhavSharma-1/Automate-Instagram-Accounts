"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: fd.get("username"),
        igUserId: fd.get("igUserId"),
        accessToken: fd.get("accessToken"),
        dailyLimit: Number(fd.get("dailyLimit")),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr("Failed to add account. Check the fields and try again.");
      return;
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="row">
        <div style={{ flex: 1 }}>
          <label>Username</label>
          <input name="username" placeholder="mybrand" required />
        </div>
        <div style={{ flex: 1 }}>
          <label>IG User ID</label>
          <input name="igUserId" placeholder="178414…" required />
        </div>
        <div style={{ width: 120 }}>
          <label>Posts / day</label>
          <input name="dailyLimit" type="number" min={1} max={50} defaultValue={3} />
        </div>
      </div>
      <label>Long-lived access token</label>
      <input name="accessToken" placeholder="EAAB…" required />
      {err && <p style={{ color: "var(--bad)" }}>{err}</p>}
      <div style={{ marginTop: 12 }}>
        <button disabled={busy}>{busy ? "Saving…" : "Add account"}</button>
      </div>
    </form>
  );
}
