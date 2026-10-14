import { Suspense } from "react";
import { ShopNav } from "@/components/shop/ShopNav";
import "@/components/shop/shop.css";
import { BookCreator } from "@/components/book/BookCreator";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Make a custom picture book | GreetHub",
  description: "A hardcover picture book starring your people, drawn from your story and photos. Approve the look and every page before we print.",
  path: "/create/book",
  noPin: true,
});

export default function Page() {
  return (
    <>
      <Suspense>
        <ShopNav />
      </Suspense>
      <main id="main" tabIndex={-1}>
        <BookCreator />
      </main>
    </>
  );
}
