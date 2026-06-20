import { prisma } from "./db";
import { generateCaption } from "./caption";
import { renderVideo } from "./video";

// Turns a Product into a generated Post sitting in PENDING_APPROVAL.
// Nothing here publishes — approval is a human step in the admin panel.
export async function generatePostForProduct(opts: {
  accountId: string;
  productId: string;
  captionTemplate: string;
  scriptTemplate?: string;
  scheduledFor?: Date;
  isHighlight?: boolean;
}) {
  const product = await prisma.product.findUniqueOrThrow({ where: { id: opts.productId } });

  const post = await prisma.post.create({
    data: {
      accountId: opts.accountId,
      productId: product.id,
      status: "GENERATING",
      scheduledFor: opts.scheduledFor,
      isHighlight: opts.isHighlight ?? false,
    },
  });

  try {
    const features = (product.description ?? "").split("\n").filter(Boolean).slice(0, 6);

    // A simple narration script; swap for an AI-generated script template if desired.
    const script =
      opts.scriptTemplate ??
      `Unboxing the ${product.title}. ${features.slice(0, 3).join(". ")}. Link in caption!`;

    const [video, caption] = await Promise.all([
      renderVideo({ productTitle: product.title, imageUrls: product.imageUrls, script }),
      generateCaption({
        title: product.title,
        priceText: product.priceText ?? undefined,
        features,
        affiliateUrl: product.affiliateUrl,
        template: opts.captionTemplate,
      }),
    ]);

    return prisma.post.update({
      where: { id: post.id },
      data: {
        status: "PENDING_APPROVAL",
        caption,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
      },
    });
  } catch (err) {
    await prisma.post.update({
      where: { id: post.id },
      data: { status: "FAILED", error: err instanceof Error ? err.message : String(err) },
    });
    throw err;
  }
}
