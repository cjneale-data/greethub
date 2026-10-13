import type { Metadata } from "next";
import { LegalStub } from "@/components/shop/LegalStub";

export const metadata: Metadata = { title: "Accessibility | GreetHub" };

export default function AccessibilityPage() {
  return (
    <LegalStub title="Accessibility" summary="We're building for WCAG 2.2 AA.">
      <div dangerouslySetInnerHTML={{ __html: '<p>Found something hard to use? Email <a class="gs-link" href="mailto:hello@greethub.example">hello@greethub.example</a> and tell us what happened.</p>' }} />
    </LegalStub>
  );
}
