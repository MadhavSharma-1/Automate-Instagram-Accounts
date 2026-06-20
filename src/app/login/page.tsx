"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: fd.get("password") }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr((await res.json().catch(() => ({}))).error ?? "Login failed.");
      return;
    }
    router.replace(params.get("next") || "/");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 360, margin: "12vh auto" }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>🔒 Admin login</h2>
        <p className="muted">Enter the admin password to access the panel.</p>
        <form onSubmit={onSubmit}>
          <label>Password</label>
          <input name="password" type="password" autoFocus required />
          {err && <p style={{ color: "var(--bad)" }}>{err}</p>}
          <div style={{ marginTop: 12 }}>
            <button disabled={busy}>{busy ? "Checking…" : "Log in"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
