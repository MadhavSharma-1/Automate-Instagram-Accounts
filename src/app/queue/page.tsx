import { prisma } from "@/lib/db";
import { QueueItem } from "./QueueItem";
import { PublishNowButton } from "./PublishNowButton";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const pending = await prisma.post
    .findMany({
      where: { status: { in: ["PENDING_APPROVAL", "GENERATING", "FAILED"] } },
      include: { product: true, account: true },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  const approved = await prisma.post
    .findMany({
      where: { status: "APPROVED" },
      include: { product: true, account: true },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  const recent = await prisma.post
    .findMany({
      where: { status: { in: ["PUBLISHED", "PUBLISHING"] } },
      include: { product: true, account: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
    })
    .catch(() => []);

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
        <h2 style={{ margin: 0 }}>Approval Queue</h2>
        <PublishNowButton />
      </div>
      <p className="muted" style={{ marginTop: 6 }}>
        Review each generated Reel and caption. Approve to queue it — or hit{" "}
        <strong>Publish now</strong> to skip the 10-min wait.
      </p>

      {/* Pending approval */}
      <h3 style={{ marginBottom: 8 }}>Pending review ({pending.length})</h3>
      {pending.length === 0 && (
        <div className="card muted">Nothing waiting. Generate posts from Sources &amp; Products.</div>
      )}
      {pending.map((p) => (
        <QueueItem
          key={p.id}
          id={p.id}
          status={p.status}
          caption={p.caption ?? ""}
          videoUrl={p.videoUrl}
          thumbnailUrl={p.thumbnailUrl}
          error={p.error}
          account={p.account.username}
          productTitle={p.product?.title ?? "—"}
        />
      ))}

      {/* Approved / waiting to publish */}
      {approved.length > 0 && (
        <>
          <h3 style={{ marginBottom: 8, marginTop: 24 }}>Approved — waiting to publish ({approved.length})</h3>
          {approved.map((p) => (
            <QueueItem
              key={p.id}
              id={p.id}
              status={p.status}
              caption={p.caption ?? ""}
              videoUrl={p.videoUrl}
              thumbnailUrl={p.thumbnailUrl}
              error={p.error}
              account={p.account.username}
              productTitle={p.product?.title ?? "—"}
            />
          ))}
        </>
      )}

      {/* Recently published */}
      {recent.length > 0 && (
        <>
          <h3 style={{ marginBottom: 8, marginTop: 24 }}>Recently published</h3>
          {recent.map((p) => (
            <QueueItem
              key={p.id}
              id={p.id}
              status={p.status}
              caption={p.caption ?? ""}
              videoUrl={p.videoUrl}
              thumbnailUrl={p.thumbnailUrl}
              error={p.error}
              account={p.account.username}
              productTitle={p.product?.title ?? "—"}
            />
          ))}
        </>
      )}
    </div>
  );
}
