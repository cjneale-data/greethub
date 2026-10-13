import { SiteNav } from "@/components/brand";
import { pageMetadata } from "@/lib/seo";
import { CardCreator } from "./CardCreator";

export const metadata = pageMetadata({
  title: "Make a custom illustrated card | GreetHub",
  description: "Tell us who it's for and what you'd say. We draw a one-of-a-kind card and help with the words. Try one free preview, no account needed.",
  path: "/create/card",
  noPin: true,
});

export default function Page() {
  return (
    <>
      <SiteNav />
      <main id="main" tabIndex={-1} className="gc-page">
        <CardCreator />
      </main>
    </>
  );
}
