import type { Metadata } from "next";
import { LegalStub } from "@/components/shop/LegalStub";

export const metadata: Metadata = { title: "Refund and Reprint Policy | GreetHub" };

export default function RefundsPage() {
  return (
    <LegalStub title="Refund & Reprint Policy" summary="If it's not right.">
      <div dangerouslySetInnerHTML={{ __html: "<p>If something arrives damaged or printed wrong, tell us within 30 days and we'll reprint it or refund it. Personalised items can't be returned just for a change of mind, so look closely at the proof first.</p>" }} />
    </LegalStub>
  );
}
