import type { Metadata } from "next";
import { WritingPage } from "@/components/shop/Writing";

export const metadata: Metadata = { title: "Handwriting & signature | GreetHub" };

export default function Page() {
  return <WritingPage />;
}
