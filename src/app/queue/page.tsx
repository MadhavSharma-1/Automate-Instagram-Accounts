import { prisma } from "@/lib/db";
import { QueueItem } from "./QueueItem";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const posts = await prisma.post
    .findMany({
      where: { status: { in: ["PENDING_APPROVAL", "GENERATING", "FAILED"] } },
      include: { product: true, account: true },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  return (
    <div>
      <h2>Approval Queue</h2>
      <p className="muted">
        Review each generated Reel and caption. Edit the caption if needed, then approve — the worker
        publishes approved posts within each account&apos;s daily limit.
      </p>
      {posts.length === 0 && <div className="card muted">Nothing waiting. Generate posts from Sources &amp; Products.</div>}
      {posts.map((p) => (
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
    </div>
  );
}
