import type { Metadata } from "next";
import { SiteNav } from "@/components/brand";
import { CardCreator } from "./CardCreator";

export const metadata: Metadata = { title: "Start a card | GreetHub" };

export default function Page() {
  return (
    <>
      <SiteNav />
      <main className="gc-page">
        <CardCreator />
      </main>
    </>
  );
}
