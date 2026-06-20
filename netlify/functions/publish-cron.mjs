// Netlify Scheduled Function — fires every 10 minutes (see netlify.toml) and
// asks the app to publish any approved, due posts. Keeps publishing logic in
// one place (/api/cron/publish), which is guarded by the x-cron-secret header.

export default async () => {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (!base) return new Response("No site URL available", { status: 500 });

  const res = await fetch(`${base}/api/cron/publish`, {
    method: "POST",
    headers: { "x-cron-secret": process.env.ADMIN_PASSWORD ?? "" },
  });

  const body = await res.text();
  return new Response(`cron status ${res.status}: ${body}`, { status: res.ok ? 200 : 502 });
};
