import { prisma } from "@/lib/db";
import { AccountForm } from "./AccountForm";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const accounts = await prisma.instagramAccount.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []);

  return (
    <div>
      <h2>Instagram Accounts</h2>
      <div className="card">
        <h3>Connect an account</h3>
        <p className="muted">
          Use an Instagram <strong>Business or Creator</strong> account linked to a Facebook Page. Get the
          IG user id and a long-lived access token from your Meta app (Instagram Graph API).
        </p>
        <AccountForm />
      </div>

      <div className="card">
        <h3>Connected ({accounts.length})</h3>
        <table>
          <thead>
            <tr><th>Username</th><th>IG User ID</th><th>Daily limit</th><th>Status</th></tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>@{a.username}</td>
                <td className="muted">{a.igUserId}</td>
                <td>{a.dailyLimit}/day</td>
                <td><span className="badge">{a.active ? "active" : "paused"}</span></td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr><td colSpan={4} className="muted">No accounts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
