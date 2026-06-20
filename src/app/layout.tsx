import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export const metadata: Metadata = {
  title: "UnboxItDaily — Admin",
  description: "Admin panel for @unboxitdaily — AI-generated affiliate product Reels.",
};

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/accounts", label: "Accounts" },
  { href: "/sources", label: "Sources & Products" },
  { href: "/templates", label: "Prompts" },
  { href: "/queue", label: "Approval Queue" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <h1 className="brand">◈ UNBOXITDAILY</h1>
            <div className="sysled">
              <span className="dot" /> SYSTEM ONLINE
            </div>
            <nav>
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="navlink">
                  {n.label}
                </Link>
              ))}
            </nav>
            <p className="disclaimer">
              Posts publish via the official Instagram Graph API. Affiliate &amp; AI-content
              disclosures are added automatically.
            </p>
            <LogoutButton />
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
