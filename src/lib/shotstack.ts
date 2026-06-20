// Shotstack video rendering — builds an unboxing-style vertical montage from
// product images + on-screen text, submits it, polls until done, and returns
// the hosted MP4 URL (which the Instagram Graph API can publish directly).
//
// Docs: https://shotstack.io/docs/api/
//
// Env:
//   SHOTSTACK_API_KEY   your key
//   SHOTSTACK_ENV       "stage" (free sandbox, watermarked) | "v1" (production)
//   SHOTSTACK_MUSIC_URL optional public mp3 used as a soundtrack

import type { VideoJob, VideoResult } from "./video";

const SECONDS_PER_IMAGE = 3;
const MIN_DURATION = 6;

interface ShotstackRenderResponse {
  success: boolean;
  message: string;
  response: { id: string };
}

interface ShotstackStatusResponse {
  success: boolean;
  response: {
    status: "queued" | "fetching" | "rendering" | "saving" | "done" | "failed";
    error?: string;
    url?: string;
    poster?: string;
    thumbnail?: string;
  };
}

function host(): string {
  const env = process.env.SHOTSTACK_ENV ?? "stage";
  return `https://api.shotstack.io/${env}`;
}

// Build the Shotstack "edit" JSON: a vertical 1080x1920 timeline with an image
// montage (Ken Burns zoom + fades) on the bottom track and text overlays on top.
function buildEdit(job: VideoJob) {
  const images = job.imageUrls.length > 0 ? job.imageUrls : [];
  const imageLen = SECONDS_PER_IMAGE;
  const total = Math.max(MIN_DURATION, images.length * imageLen || MIN_DURATION);

  const zooms = ["zoomIn", "slideLeft", "slideRight", "zoomIn"] as const;

  // Bottom track: the product images (or a solid card if none provided).
  const imageClips =
    images.length > 0
      ? images.map((src, i) => ({
          asset: { type: "image", src },
          start: i * imageLen,
          length: imageLen,
          fit: "cover",
          effect: zooms[i % zooms.length],
          transition: { in: "fade", out: "fade" },
        }))
      : [];

  // Top track: a title at the top, an "AI-generated" tag, and a CTA at the end.
  const titleClip = {
    asset: {
      type: "title",
      text: job.productTitle,
      style: "minimal",
      size: "medium",
      position: "top",
      color: "#ffffff",
      background: "#000000",
    },
    start: 0,
    length: total,
    transition: { in: "slideUp" },
  };

  const aiTag = {
    asset: { type: "title", text: "AI-generated", style: "subtitle", size: "x-small", position: "topRight", color: "#cccccc" },
    start: 0,
    length: total,
  };

  const ctaClip = {
    asset: { type: "title", text: "🛒 Link in caption", style: "blockbuster", size: "small", position: "bottom", color: "#ffffff" },
    start: Math.max(0, total - 2.5),
    length: 2.5,
    transition: { in: "carouselUp" },
  };

  const tracks: Array<{ clips: unknown[] }> = [{ clips: [titleClip, aiTag, ctaClip] }];
  if (imageClips.length > 0) tracks.push({ clips: imageClips });

  const timeline: Record<string, unknown> = { background: "#000000", tracks };
  if (process.env.SHOTSTACK_MUSIC_URL) {
    timeline.soundtrack = { src: process.env.SHOTSTACK_MUSIC_URL, effect: "fadeOut" };
  }

  return {
    timeline,
    output: {
      format: "mp4",
      size: { width: 1080, height: 1920 }, // vertical, Reels-ready
      fps: 30,
      thumbnail: { capture: 1, scale: 0.3 },
    },
  };
}

async function submitRender(edit: unknown): Promise<string> {
  const res = await fetch(`${host()}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.SHOTSTACK_API_KEY! },
    body: JSON.stringify(edit),
  });
  const json = (await res.json()) as ShotstackRenderResponse & { message?: string };
  if (!res.ok || !json.success) {
    throw new Error(`Shotstack submit failed: ${json.message ?? res.statusText}`);
  }
  return json.response.id;
}

async function pollRender(
  id: string,
  { timeoutMs = 5 * 60_000, intervalMs = 5_000 } = {}
): Promise<{ url: string; thumbnail?: string }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${host()}/render/${id}?data=false`, {
      headers: { "x-api-key": process.env.SHOTSTACK_API_KEY! },
    });
    const json = (await res.json()) as ShotstackStatusResponse;
    const r = json.response;
    if (r.status === "done" && r.url) return { url: r.url, thumbnail: r.thumbnail ?? r.poster };
    if (r.status === "failed") throw new Error(`Shotstack render failed: ${r.error ?? "unknown error"}`);
    await new Promise((res) => setTimeout(res, intervalMs));
  }
  throw new Error("Shotstack render timed out.");
}

export async function renderWithShotstack(job: VideoJob): Promise<VideoResult> {
  if (!process.env.SHOTSTACK_API_KEY) throw new Error("SHOTSTACK_API_KEY not set");
  const edit = buildEdit(job);
  const id = await submitRender(edit);
  const { url, thumbnail } = await pollRender(id);
  return { videoUrl: url, thumbnailUrl: thumbnail, provider: "shotstack" };
}
