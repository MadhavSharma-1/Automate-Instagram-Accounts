import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.promptTemplate.upsert({
    where: { id: "default-caption" },
    update: {},
    create: {
      id: "default-caption",
      name: "Default unboxing caption",
      kind: "caption",
      isDefault: true,
      body:
        "You are the voice of @unboxitdaily, an Instagram Reels account that posts daily unboxing content. " +
        "Write a punchy, exciting caption for {{title}} ({{price}}). " +
        "Highlight these features: {{features}}. " +
        "Make it feel like a genuine reaction — excited but honest. " +
        "Include a clear call-to-action to grab it via {{link}}. " +
        "End with 10-15 hashtags mixing high-volume (#unboxing #amazonfinds #deals) and niche tags relevant to this product. " +
        "Keep it under 300 words. No fluff.",
    },
  });

  // A "manual" source so you can paste products before wiring affiliate APIs.
  await prisma.productSource.upsert({
    where: { id: "manual-default" },
    update: {},
    create: { id: "manual-default", kind: "manual", label: "Manual entries", enabled: true },
  });

  console.log("Seeded default template + manual source.");
}

main().finally(() => prisma.$disconnect());
