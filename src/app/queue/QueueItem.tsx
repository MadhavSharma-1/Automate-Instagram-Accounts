"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function QueueItem(props: {
  id: string;
  status: string;
  caption: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
  account: string;
  productTitle: string;
}) {
  const router = useRouter();
  const [caption, setCaption] = useState(props.caption);
  const [busy, setBusy] = useState(false);

  async function act(action: "approve" | "reject") {
    setBusy(true);
    await fetch(`/api/posts/${props.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, caption }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>{props.productTitle}</strong>
        <span className="badge">@{props.account} · {props.status}</span>
      </div>

      {props.error && <p style={{ color: "var(--bad)" }}>Error: {props.error}</p>}

      <div className="row" style={{ alignItems: "flex-start", marginTop: 10 }}>
        {props.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="thumb" src={props.thumbnailUrl} alt="" />
        ) : (
          <div className="thumb" />
        )}
        <div style={{ flex: 1, minWidth: 280 }}>
          <label>Caption (editable)</label>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} />
          {props.videoUrl && (
            <a className="muted" href={props.videoUrl} target="_blank" rel="noreferrer">
              ▶ Preview rendered video
            </a>
          )}
        </div>
      </div>

      {props.status === "PENDING_APPROVAL" && (
        <div className="row" style={{ marginTop: 12 }}>
          <button className="good" disabled={busy} onClick={() => act("approve")}>
            Approve &amp; queue
          </button>
          <button className="bad secondary" disabled={busy} onClick={() => act("reject")}>
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
