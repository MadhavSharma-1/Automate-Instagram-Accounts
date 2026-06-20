import { prisma } from "./db";
import { publishReel } from "./instagram";

// Publishes APPROVED posts whose time has come, respecting each account's
// dailyLimit. Call this on an interval (cron / worker). Designed to be safe to
// run repeatedly — it only picks up due, approved work.

function startOfUtcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function runDuePublishes(now = new Date()): Promise<{ published: number; failed: number }> {
  const dayStart = startOfUtcDay(now);
  let published = 0;
  let failed = 0;

  const accounts = await prisma.instagramAccount.findMany({ where: { active: true } });

  for (const account of accounts) {
    const postedToday = await prisma.post.count({
      where: { accountId: account.id, status: "PUBLISHED", publishedAt: { gte: dayStart } },
    });
    const remaining = account.dailyLimit - postedToday;
    if (remaining <= 0) continue;

    const due = await prisma.post.findMany({
      where: {
        accountId: account.id,
        status: "APPROVED",
        OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
      },
      orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
      take: remaining,
    });

    for (const post of due) {
      if (!post.videoUrl || !post.caption) {
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "FAILED", error: "Missing video or caption at publish time." },
        });
        failed++;
        continue;
      }

      await prisma.post.update({ where: { id: post.id }, data: { status: "PUBLISHING" } });
      try {
        const { containerId, mediaId } = await publishReel({
          igUserId: account.igUserId,
          accessToken: account.accessToken,
          videoUrl: post.videoUrl,
          caption: post.caption,
          coverUrl: post.thumbnailUrl ?? undefined,
        });
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: "PUBLISHED",
            igContainerId: containerId,
            igMediaId: mediaId,
            publishedAt: new Date(),
            error: null,
          },
        });
        published++;
      } catch (err) {
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "FAILED", error: err instanceof Error ? err.message : String(err) },
        });
        failed++;
      }
    }
  }

  return { published, failed };
}
