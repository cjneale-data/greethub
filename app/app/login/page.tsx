import { SiteNav } from "@/components/brand";

export default function Page() {
  return (
    <>
      <SiteNav />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 28px" }}>
        <h1 style={{ fontFamily: "var(--gh-font-display)", fontWeight: 800, letterSpacing: "-0.03em" }}>Sign in</h1>
        <p>Auth is stubbed. See lib/adapters and docs/cto/setup-needed.md.</p>
      </main>
    </>
  );
}
