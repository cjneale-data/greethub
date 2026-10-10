import { SiteNav } from "@/components/brand";

export default function Page() {
  return (
    <>
      <SiteNav />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 28px" }}>
        <h1 style={{ fontFamily: "var(--gh-font-display)", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Make a picture book
        </h1>
        <p>The creator arrives in milestone M3 (intake) and M4 (book flow).</p>
      </main>
    </>
  );
}
