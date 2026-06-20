// Minimal password auth for the admin panel.
//
// A single shared password (ADMIN_PASSWORD) gates the whole site. On login we
// set an httpOnly cookie whose value is a SHA-256 token derived from the
// password; middleware recomputes and compares it on every request. Uses Web
// Crypto so it runs in both the Edge (middleware) and Node runtimes.

export const SESSION_COOKIE = "iga_session";

export async function sessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`iga-session:v1:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !cookieValue) return false;
  const expected = await sessionToken(password);
  // constant-ish time compare
  if (cookieValue.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= cookieValue.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
