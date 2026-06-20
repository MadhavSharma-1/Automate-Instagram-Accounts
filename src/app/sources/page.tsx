import { prisma } from "@/lib/db";
import { SUPPORTED_SOURCE_KINDS } from "@/lib/sources/registry";
import { SourcesClient } from "./SourcesClient";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const [sources, products, accounts, templates] = await Promise.all([
    prisma.productSource.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { source: true } }),
    prisma.instagramAccount.findMany({ where: { active: true } }),
    prisma.promptTemplate.findMany({ where: { kind: "caption" } }),
  ]).catch(() => [[], [], [], []] as const);

  return (
    <SourcesClient
      kinds={SUPPORTED_SOURCE_KINDS}
      sources={sources.map((s) => ({ id: s.id, kind: s.kind, label: s.label }))}
      products={products.map((p) => ({ id: p.id, title: p.title, source: p.source.label, image: p.imageUrls[0] ?? null }))}
      accounts={accounts.map((a) => ({ id: a.id, username: a.username }))}
      templates={templates.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
