import { prisma } from "@/lib/db";
import { TemplateForm } from "./TemplateForm";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await prisma.promptTemplate.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []);

  return (
    <div>
      <h2>Prompt Templates</h2>
      <div className="card">
        <h3>New template</h3>
        <p className="muted">
          Placeholders: <code>{"{{title}}"}</code> <code>{"{{price}}"}</code> <code>{"{{features}}"}</code>{" "}
          <code>{"{{link}}"}</code>. The affiliate (#ad) and AI-content disclosures are always appended
          automatically — you don&apos;t need to add them.
        </p>
        <TemplateForm />
      </div>

      <div className="card">
        <h3>Saved ({templates.length})</h3>
        {templates.map((t) => (
          <div key={t.id} style={{ borderBottom: "1px solid var(--line)", padding: "10px 0" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{t.name}</strong>
              <span className="badge">{t.kind}{t.isDefault ? " · default" : ""}</span>
            </div>
            <pre className="muted" style={{ whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{t.body}</pre>
          </div>
        ))}
        {templates.length === 0 && <p className="muted">No templates yet — a built-in default is used until you add one.</p>}
      </div>
    </div>
  );
}
