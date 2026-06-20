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

  async function del() {
    if (!confirm("Delete this post?")) return;
    setBusy(true);
    await fetch(`/api/posts/${props.id}`, { method: "DELETE" });
    router.refresh();
  }

  const isStubUrl = props.videoUrl?.includes("example-cdn.invalid");
  const canPreview = props.videoUrl && !isStubUrl;

  const statusColor =
    props.status === "FAILED" ? "var(--bad)"
    : props.status === "PUBLISHED" ? "var(--good)"
    : props.status === "APPROVED" ? "var(--warn)"
    : "var(--muted)";

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong style={{ flex: 1, marginRight: 12 }}>{props.productTitle}</strong>
        <span className="badge" style={{ borderColor: statusColor, color: statusColor }}>
          @{props.account} · {props.status}
        </span>
      </div>

      {props.error && (
        <p style={{ color: "var(--bad)", fontSize: 13, margin: "8px 0 0" }}>
          ⚠ {props.error}
        </p>
      )}

      {isStubUrl && (
        <p style={{ color: "var(--warn)", fontSize: 13, margin: "6px 0 0" }}>
          ⚠ This post used the stub video provider — set <code>VIDEO_PROVIDER=shotstack</code> in Netlify env vars, redeploy, then regenerate.
        </p>
      )}

      <div className="row" style={{ alignItems: "flex-start", marginTop: 12, gap: 16 }}>
        {/* Thumbnail / video preview */}
        <div style={{ flexShrink: 0 }}>
          {canPreview ? (
            <video
              className="thumb"
              src={props.videoUrl!}
              controls
              style={{ width: 80, height: 120 }}
              poster={props.thumbnailUrl ?? undefined}
            />
          ) : props.thumbnailUrl && !isStubUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="thumb" src={props.thumbnailUrl} alt="" />
          ) : props.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="thumb" src={props.thumbnailUrl} alt="" style={{ opacity: 0.5 }} />
          ) : (
            <div className="thumb" />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <label>Caption {props.status === "PENDING_APPROVAL" ? "(editable)" : ""}</label>
          {props.status === "PENDING_APPROVAL" ? (
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} />
          ) : (
            <p style={{ fontSize: 13, whiteSpace: "pre-wrap", margin: 0, color: "var(--muted)" }}>
              {caption.slice(0, 300)}{caption.length > 300 ? "…" : ""}
            </p>
          )}
          {canPreview && (
            <a className="muted" href={props.videoUrl!} target="_blank" rel="noreferrer" style={{ fontSize: 13, marginTop: 6, display: "block" }}>
              ▶ Open video in new tab
            </a>
          )}
        </div>
      </div>

      <div className="row" style={{ marginTop: 14, gap: 10 }}>
        {props.status === "PENDING_APPROVAL" && (
          <>
            <button className="good" disabled={busy} onClick={() => act("approve")}>
              Approve &amp; queue
            </button>
            <button className="bad secondary" disabled={busy} onClick={() => act("reject")}>
              Reject
            </button>
          </>
        )}
        {(props.status === "FAILED" || props.status === "REJECTED") && (
          <button className="bad" disabled={busy} onClick={del}>
            🗑 Delete
          </button>
        )}
        {props.status === "PUBLISHED" && props.error == null && (
          <span style={{ color: "var(--good)", fontSize: 13 }}>✅ Live on Instagram</span>
        )}
      </div>
    </div>
  );
}
