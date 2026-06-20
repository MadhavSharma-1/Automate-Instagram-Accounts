import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Default to the latest Opus model; override via ANTHROPIC_MODEL.
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

export interface CaptionInput {
  title: string;
  priceText?: string;
  features?: string[];
  affiliateUrl: string;
  /** Editable prompt template body from the admin panel. */
  template: string;
}

/**
 * Required disclosures appended to every caption:
 *  - FTC affiliate disclosure (#ad / commissions earned)
 *  - AI-content label (Instagram requires labeling AI-generated media)
 * Keeping these in code (not just the editable template) means they can't be
 * accidentally removed and get you shadow-banned or in legal trouble.
 */
const DISCLOSURE = "\n\n#ad — affiliate link, I may earn a commission. Content is AI-generated. 🤖";

function fillTemplate(tpl: string, input: CaptionInput): string {
  return tpl
    .replaceAll("{{title}}", input.title)
    .replaceAll("{{price}}", input.priceText ?? "")
    .replaceAll("{{features}}", (input.features ?? []).join(", "))
    .replaceAll("{{link}}", input.affiliateUrl);
}

export async function generateCaption(input: CaptionInput): Promise<string> {
  const filledInstruction = fillTemplate(input.template, input);

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system:
      "You write short, punchy Instagram Reels captions for affiliate product content. " +
      "Be engaging and honest. Do not invent specs or fake reviews. Keep it under 2200 characters. " +
      "Return ONLY the caption text and hashtags — no preamble, no quotes.",
    messages: [
      {
        role: "user",
        content:
          `${filledInstruction}\n\n---\nProduct: ${input.title}\n` +
          `Price: ${input.priceText ?? "n/a"}\n` +
          `Features: ${(input.features ?? []).join("; ") || "n/a"}\n` +
          `Buy link to include: ${input.affiliateUrl}`,
      },
    ],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  // Guarantee the buy link and disclosure are present.
  const withLink = text.includes(input.affiliateUrl) ? text : `${text}\n\n🛒 ${input.affiliateUrl}`;
  return `${withLink}${DISCLOSURE}`;
}
