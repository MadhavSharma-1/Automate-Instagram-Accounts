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
        "Write a fun, honest unboxing-style Instagram Reels caption for {{title}} ({{price}}). " +
        "Highlight these features: {{features}}. End with a clear call-to-action to buy via {{link}}. " +
        "Add 8-12 relevant hashtags. Keep an upbeat, authentic tone.",
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
