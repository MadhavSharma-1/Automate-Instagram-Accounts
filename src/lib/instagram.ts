// Instagram publishing via the OFFICIAL Graph API (Content Publishing).
//
// This is the sanctioned path (vs. automating the private app), which keeps your
// accounts in good standing. Two supported setups:
//
//   A) Instagram API with Instagram Login (recommended — no Facebook Page needed):
//        base = https://graph.instagram.com/v21.0
//        Get a token from your Meta app → Instagram → "API setup with Instagram
//        login" → "Generate access tokens" → Add account.
//
//   B) Instagram API with Facebook Login (account must be linked to a FB Page):
//        base = https://graph.facebook.com/v21.0
//
// Set IG_API_BASE to switch. Reels are published from a PUBLIC video URL in two steps:
//       1) create a media container (POST /{ig-user-id}/media)
//       2) publish it          (POST /{ig-user-id}/media_publish)
//
// Docs: https://developers.facebook.com/docs/instagram-platform/content-publishing

const GRAPH = process.env.IG_API_BASE ?? "https://graph.instagram.com/v21.0";

export interface PublishReelParams {
  igUserId: string;
  accessToken: string;
  videoUrl: string; // must be publicly reachable
  caption: string;
  coverUrl?: string;
}

interface ContainerResponse {
  id: string;
}

async function graphPost(path: string, body: Record<string, string>): Promise<ContainerResponse> {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  const json = (await res.json()) as ContainerResponse & { error?: { message: string } };
  if (!res.ok || json.error) {
    throw new Error(`Graph API error on ${path}: ${json.error?.message ?? res.statusText}`);
  }
  return json;
}

/** Step 1: create the Reel container. Returns container id. */
export async function createReelContainer(p: PublishReelParams): Promise<string> {
  const body: Record<string, string> = {
    media_type: "REELS",
    video_url: p.videoUrl,
    caption: p.caption,
    access_token: p.accessToken,
  };
  if (p.coverUrl) body.cover_url = p.coverUrl;
  const { id } = await graphPost(`${p.igUserId}/media`, body);
  return id;
}

/** Poll container status until FINISHED (video must transcode before publish). */
export async function waitForContainer(
  containerId: string,
  accessToken: string,
  { timeoutMs = 5 * 60_000, intervalMs = 5_000 } = {}
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(
      `${GRAPH}/${containerId}?fields=status_code&access_token=${encodeURIComponent(accessToken)}`
    );
    const json = (await res.json()) as { status_code?: string; error?: { message: string } };
    if (json.error) throw new Error(`Graph API status error: ${json.error.message}`);
    if (json.status_code === "FINISHED") return;
    if (json.status_code === "ERROR") throw new Error("Container processing failed (ERROR).");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Timed out waiting for media container to finish processing.");
}

/** Step 2: publish the finished container. Returns the published media id. */
export async function publishContainer(
  igUserId: string,
  accessToken: string,
  creationId: string
): Promise<string> {
  const { id } = await graphPost(`${igUserId}/media_publish`, {
    creation_id: creationId,
    access_token: accessToken,
  });
  return id;
}

/** Convenience: full create -> wait -> publish flow. */
export async function publishReel(p: PublishReelParams): Promise<{ containerId: string; mediaId: string }> {
  const containerId = await createReelContainer(p);
  await waitForContainer(containerId, p.accessToken);
  const mediaId = await publishContainer(p.igUserId, p.accessToken, containerId);
  return { containerId, mediaId };
}
