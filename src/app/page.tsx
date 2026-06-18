import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [accounts, pending, publishedToday, sources] = await Promise.all([
    prisma.instagramAccount.count({ where: { active: true } }),
    prisma.post.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.post.count({
      where: {
        status: "PUBLISHED",
        publishedAt: { gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) },
      },
    }),
    prisma.productSource.count({ where: { enabled: true } }),
  ]).catch(() => [0, 0, 0, 0]);

  const stats = [
    { label: "Active accounts", value: accounts },
    { label: "Awaiting approval", value: pending },
    { label: "Published today", value: publishedToday },
    { label: "Enabled sources", value: sources },
  ];

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="grid">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="muted">{s.label}</div>
            <div className="stat">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>How it works</h3>
        <ol className="muted">
          <li>Connect Instagram Business/Creator accounts and set a daily post limit (e.g. 3/day).</li>
          <li>Configure affiliate sources (Amazon / AliExpress / Temu) or paste products manually.</li>
          <li>Generate posts → AI renders an unboxing Reel + writes a caption with your buy link.</li>
          <li>Review in the Approval Queue → approve → the worker publishes within the daily limit.</li>
        </ol>
        <p className="muted">
          Affiliate (#ad) and AI-content disclosures are appended to every caption automatically.
        </p>
      </div>
    </div>
  );
}
