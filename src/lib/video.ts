// Video generation pipeline (pluggable provider).
//
// The Instagram Graph API publishes Reels from a PUBLIC video URL, so the job of
// this module is: take product images + script -> render an unboxing-style
// vertical (1080x1920) video -> upload to public storage -> return the URL.
//
// Providers are swappable via VIDEO_PROVIDER:
//   - "stub":      returns a placeholder URL (lets you test the whole pipeline
//                  end-to-end without spending money or keys)
//   - "shotstack": template-based cloud video rendering (good for image-driven
//                  unboxing montages with captions + voiceover)
//   - "replicate": run a text/image-to-video model (more "AI generated" look)
//
// All providers must label output as AI-generated (also enforced in captions).

export interface VideoJob {
  productTitle: string;
  imageUrls: string[];
  /** Short narration / on-screen script (can be AI-generated upstream). */
  script: string;
}

export interface VideoResult {
  videoUrl: string;
  thumbnailUrl?: string;
  provider: string;
}

export async function renderVideo(job: VideoJob): Promise<VideoResult> {
  const provider = process.env.VIDEO_PROVIDER ?? "stub";
  switch (provider) {
    case "stub":
      return renderStub(job);
    case "shotstack":
      return renderShotstack(job);
    case "replicate":
      return renderReplicate(job);
    default:
      throw new Error(`Unknown VIDEO_PROVIDER: ${provider}`);
  }
}

async function renderStub(job: VideoJob): Promise<VideoResult> {
  // Deterministic placeholder so the approval queue / publisher can be exercised.
  return {
    videoUrl: "https://example-cdn.invalid/placeholder-unboxing.mp4",
    thumbnailUrl: job.imageUrls[0],
    provider: "stub",
  };
}

async function renderShotstack(_job: VideoJob): Promise<VideoResult> {
  if (!process.env.SHOTSTACK_API_KEY) throw new Error("SHOTSTACK_API_KEY not set");
  // INTEGRATION POINT: POST a Shotstack edit JSON (image clips + Ken Burns +
  // title/captions + optional TTS voiceover track), poll the render, then
  // return the hosted URL. See https://shotstack.io/docs/
  throw new Error("Shotstack provider not wired yet. Implement renderShotstack().");
}

async function renderReplicate(_job: VideoJob): Promise<VideoResult> {
  if (!process.env.REPLICATE_API_TOKEN) throw new Error("REPLICATE_API_TOKEN not set");
  // INTEGRATION POINT: call an image/text-to-video model, upload output to S3,
  // return the public URL. See https://replicate.com/docs
  throw new Error("Replicate provider not wired yet. Implement renderReplicate().");
}
