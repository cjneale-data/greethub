import type { Metadata } from "next";
import { SiteNav } from "@/components/brand";
import { BookCreator } from "@/components/book/BookCreator";

export const metadata: Metadata = { title: "Make a picture book | GreetHub" };

export default function Page() {
  return (
    <>
      <SiteNav />
      <main>
        <BookCreator />
      </main>
    </>
  );
}
