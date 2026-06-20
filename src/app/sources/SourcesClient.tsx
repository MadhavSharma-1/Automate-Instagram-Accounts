"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Source = { id: string; kind: string; label: string };
type Product = { id: string; title: string; source: string; image: string | null; price: string | null };
type Account = { id: string; username: string };
type Template = { id: string; name: string };

export function SourcesClient(props: {
  kinds: string[];
  sources: Source[];
  products: Product[];
  accounts: Account[];
  templates: Template[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [fetchingId, setFetchingId] = useState<string | null>(null);

  async function addSource(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const kind = fd.get("kind") as string;
    const config: Record<string, string> = {};
    if (kind === "amazon") {
      config.keywords = fd.get("keywords") as string ?? "best sellers";
      config.searchIndex = fd.get("searchIndex") as string ?? "All";
    }
    await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, label: fd.get("label"), config }),
    });
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  async function fetchSource(sourceId: string) {
    setFetchingId(sourceId);
    setMsg("Fetching products from Amazon…");
    const res = await fetch(`/api/sources/${sourceId}/fetch`, { method: "POST" });
    const json = await res.json() as { fetched?: number; saved?: number; error?: string };
    setFetchingId(null);
    setMsg(res.ok
      ? `✅ Fetched ${json.fetched} products from Amazon, ${json.saved} saved to your list.`
      : `❌ Fetch failed: ${json.error}`);
    router.refresh();
  }

  async function addProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const images = String(fd.get("imageUrls") || "")
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceId: fd.get("sourceId"),
        title: fd.get("title"),
        affiliateUrl: fd.get("affiliateUrl"),
        priceText: fd.get("priceText") || undefined,
        description: fd.get("description") || undefined,
        imageUrls: images,
      }),
    });
    setMsg(res.ok ? "✅ Product added." : "❌ Failed to add product.");
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  async function generate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg("Generating… (rendering video + writing caption, takes ~30 seconds)");
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: fd.get("accountId"),
        productId: fd.get("productId"),
        templateId: fd.get("templateId") || undefined,
      }),
    });
    const json = await res.json() as { error?: string };
    setMsg(res.ok ? "✅ Generated → check the Approval Queue." : `❌ Failed: ${json.error}`);
    router.refresh();
  }

  const amazonSources = props.sources.filter((s) => s.kind === "amazon");

  return (
    <div>
      <h2>Sources &amp; Products</h2>
      {msg && (
        <div className="card" style={{ borderColor: msg.startsWith("✅") ? "var(--good)" : msg.startsWith("❌") ? "var(--bad)" : "var(--line)" }}>
          {msg}
        </div>
      )}

      {/* ── Amazon fetch panel ── */}
      {amazonSources.length > 0 && (
        <div className="card">
          <h3>Fetch products from Amazon</h3>
          <p className="muted">
            Pulls up to 10 products matching your keywords from Amazon and saves them to your product list automatically.
          </p>
          <div className="grid">
            {amazonSources.map((s) => (
              <div key={s.id} className="card" style={{ margin: 0 }}>
                <strong>{s.label}</strong>
                <div className="muted" style={{ fontSize: 13, margin: "4px 0 10px" }}>amazon · auto-fetch</div>
                <button
                  onClick={() => fetchSource(s.id)}
                  disabled={fetchingId === s.id}
                >
                  {fetchingId === s.id ? "Fetching…" : "Fetch products now"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add source ── */}
      <div className="card">
        <h3>Add a source</h3>
        <form onSubmit={addSource}>
          <div className="row">
            <div style={{ flex: 1 }}>
              <label>Type</label>
              <select name="kind" defaultValue="amazon" id="source-kind-select" onChange={(e) => {
                const amazonFields = document.getElementById("amazon-fields");
                if (amazonFields) amazonFields.style.display = e.target.value === "amazon" ? "block" : "none";
              }}>
                {props.kinds.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label>Label (just a name for you)</label>
              <input name="label" placeholder="Amazon — tech gadgets" required />
            </div>
          </div>

          {/* Amazon-specific config */}
          <div id="amazon-fields">
            <div className="row">
              <div style={{ flex: 2 }}>
                <label>Keywords to search</label>
                <input name="keywords" placeholder="wireless earbuds, portable speaker" defaultValue="best sellers" />
              </div>
              <div style={{ flex: 1 }}>
                <label>Category</label>
                <select name="searchIndex" defaultValue="All">
                  <option value="All">All</option>
                  <option value="Electronics">Electronics</option>
                  <option value="HomeAndKitchen">Home &amp; Kitchen</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Toys">Toys &amp; Games</option>
                  <option value="SportsAndOutdoors">Sports &amp; Outdoors</option>
                  <option value="HealthAndBeauty">Health &amp; Personal Care</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <button>Add source</button>
          </div>
        </form>
        <p className="muted" style={{ marginTop: 8 }}>
          Requires <strong>AMAZON_PAAPI_ACCESS_KEY</strong>, <strong>AMAZON_PAAPI_SECRET_KEY</strong>,
          and <strong>AMAZON_PARTNER_TAG</strong> in your environment variables.
        </p>
      </div>

      {/* ── Manual product ── */}
      <div className="card">
        <h3>Add a product manually</h3>
        <form onSubmit={addProduct}>
          <div className="row">
            <div style={{ flex: 1 }}>
              <label>Source</label>
              <select name="sourceId" required>
                {props.sources.map((s) => (
                  <option key={s.id} value={s.id}>{s.label} ({s.kind})</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label>Title</label>
              <input name="title" placeholder="Wireless earbuds X100" required />
            </div>
            <div style={{ width: 140 }}>
              <label>Price</label>
              <input name="priceText" placeholder="$29.99" />
            </div>
          </div>
          <label>Affiliate buy link</label>
          <input name="affiliateUrl" placeholder="https://amzn.to/… (your tracking link)" required />
          <label>Key features (one per line)</label>
          <textarea name="description" placeholder={"Active noise cancelling\n40h battery\nIPX5 waterproof"} />
          <label>Image URLs (comma or newline separated)</label>
          <textarea name="imageUrls" placeholder="https://…/1.jpg" />
          <div style={{ marginTop: 10 }}><button>Add product</button></div>
        </form>
      </div>

      {/* ── Generate a post ── */}
      <div className="card">
        <h3>Generate a post</h3>
        {props.accounts.length === 0 || props.products.length === 0 ? (
          <p className="muted">Add at least one account and one product first.</p>
        ) : (
          <form onSubmit={generate} className="row">
            <div style={{ flex: 1 }}>
              <label>Account</label>
              <select name="accountId" required>
                {props.accounts.map((a) => (
                  <option key={a.id} value={a.id}>@{a.username}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label>Product</label>
              <select name="productId" required>
                {props.products.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}{p.price ? ` — ${p.price}` : ""}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Prompt template</label>
              <select name="templateId">
                <option value="">Default</option>
                {props.templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div style={{ alignSelf: "flex-end" }}>
              <button>Generate</button>
            </div>
          </form>
        )}
      </div>

      {/* ── Product list ── */}
      <div className="card">
        <h3>Products ({props.products.length})</h3>
        {props.products.length === 0 && (
          <p className="muted">No products yet. Add an Amazon source and click "Fetch products now", or add one manually.</p>
        )}
        <div className="grid">
          {props.products.map((p) => (
            <div key={p.id} className="row">
              {p.image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img className="thumb" src={p.image} alt="" />
                : <div className="thumb" />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, lineHeight: 1.4 }}>{p.title}</div>
                <div className="muted" style={{ fontSize: 12 }}>{p.source}{p.price ? ` · ${p.price}` : ""}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
