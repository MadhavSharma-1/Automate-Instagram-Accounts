"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SAMPLE =
  "Write a fun, honest unboxing-style Instagram Reels caption for {{title}} ({{price}}). " +
  "Highlight these features: {{features}}. End with a clear call-to-action to buy via {{link}}. " +
  "Add 8-12 relevant hashtags. Keep an upbeat, authentic tone.";

export function TemplateForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        kind: fd.get("kind"),
        body: fd.get("body"),
        isDefault: fd.get("isDefault") === "on",
      }),
    });
    setBusy(false);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="row">
        <div style={{ flex: 2 }}>
          <label>Name</label>
          <input name="name" placeholder="Upbeat unboxing" required />
        </div>
        <div style={{ flex: 1 }}>
          <label>Kind</label>
          <select name="kind" defaultValue="caption">
            <option value="caption">caption</option>
            <option value="script">script</option>
          </select>
        </div>
      </div>
      <label>Prompt body</label>
      <textarea name="body" defaultValue={SAMPLE} required />
      <label className="row" style={{ marginTop: 8 }}>
        <input type="checkbox" name="isDefault" style={{ width: "auto" }} /> Make default for this kind
      </label>
      <div style={{ marginTop: 10 }}>
        <button disabled={busy}>{busy ? "Saving…" : "Save template"}</button>
      </div>
    </form>
  );
}
