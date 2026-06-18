"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Source = { id: string; kind: string; label: string };
type Product = { id: string; title: string; source: string; image: string | null };
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

  async function addSource(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: fd.get("kind"), label: fd.get("label") }),
    });
    (e.target as HTMLFormElement).reset();
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
    setMsg(res.ok ? "Product added." : "Failed to add product.");
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  async function generate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg("Generating… (rendering video + writing caption)");
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: fd.get("accountId"),
        productId: fd.get("productId"),
        templateId: fd.get("templateId") || undefined,
      }),
    });
    setMsg(res.ok ? "Generated → check the Approval Queue." : `Failed: ${(await res.json()).error}`);
    router.refresh();
  }

  return (
    <div>
      <h2>Sources &amp; Products</h2>
      {msg && <div className="card">{msg}</div>}

      <div className="card">
        <h3>Add a source</h3>
        <form onSubmit={addSource} className="row">
          <div style={{ flex: 1 }}>
            <label>Type</label>
            <select name="kind" defaultValue="manual">
              {props.kinds.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label>Label</label>
            <input name="label" placeholder="Amazon US — gadgets" required />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button>Add source</button>
          </div>
        </form>
        <p className="muted" style={{ marginTop: 8 }}>
          Affiliate sources (amazon/aliexpress/temu) ingest via their APIs once keys are set. Use{" "}
          <strong>manual</strong> to paste products now.
        </p>
      </div>

      <div className="card">
        <h3>Add a product (manual)</h3>
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
          <input name="affiliateUrl" placeholder="https://amzn.to/...  (your tracking link)" required />
          <label>Key features (one per line)</label>
          <textarea name="description" placeholder={"Active noise cancelling\n40h battery\nIPX5 waterproof"} />
          <label>Image URLs (comma or newline separated)</label>
          <textarea name="imageUrls" placeholder="https://…/1.jpg" />
          <div style={{ marginTop: 10 }}><button>Add product</button></div>
        </form>
      </div>

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
                  <option key={p.id} value={p.id}>{p.title}</option>
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

      <div className="card">
        <h3>Products ({props.products.length})</h3>
        <div className="grid">
          {props.products.map((p) => (
            <div key={p.id} className="row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.image ? <img className="thumb" src={p.image} alt="" /> : <div className="thumb" />}
              <div>
                <div>{p.title}</div>
                <div className="muted">{p.source}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
