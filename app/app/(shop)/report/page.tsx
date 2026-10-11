import type { Metadata } from "next";
import { LegalStub } from "@/components/shop/LegalStub";
import { ReportForm } from "@/components/shop/ReportForm";
import { DmcaAgentBlock } from "@/components/shop/DmcaAgentBlock";

export const metadata: Metadata = { title: "Report content | GreetHub" };

export default function ReportPage() {
  return (
    <LegalStub title="Report content" summary="Remove a photo of you or your child, or report something that shouldn't be here.">
      <ReportForm />
      <hr style={{ margin: "32px 0" }} />
      <h2 className="gs-h3">Copyright (DMCA) notices</h2>
      <p>Use the form above and choose Copyright, or send a notice to our designated agent:</p>
      <DmcaAgentBlock />
    </LegalStub>
  );
}
