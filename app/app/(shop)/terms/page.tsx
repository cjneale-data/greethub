import type { Metadata } from "next";
import { LegalStub } from "@/components/shop/LegalStub";

export const metadata: Metadata = { title: "Terms of Service | GreetHub" };

export default function TermsPage() {
  return (
    <LegalStub title="Terms of Service" summary="The rules for using GreetHub.">
      <div dangerouslySetInnerHTML={{ __html: '<h2>Who can use it</h2><p>You must be 18 or older and in the United States.</p><h2>AI-illustrated art</h2><p>Pictures are drawn by AI image models. You see them before anything prints.</p><h2>Orders</h2><p>Personalized items are made just for you. See the <a class="gs-link" href="/refunds">Refund &amp; Reprint Policy</a>.</p>' }} />
    </LegalStub>
  );
}
