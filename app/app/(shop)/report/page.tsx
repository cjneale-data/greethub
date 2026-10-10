import type { Metadata } from "next";
import { LegalStub } from "@/components/shop/LegalStub";

export const metadata: Metadata = { title: "Report content | GreetHub" };

export default function ReportPage() {
  return (
    <LegalStub title="Report content" summary="Remove a photo of you or your child, or report something that shouldn't be here.">
      <div dangerouslySetInnerHTML={{ __html: '<p>Email <a className="gs-link" href="mailto:report@greethub.example">report@greethub.example</a>. We aim to answer within 48 hours. Copyright (DMCA) agent details will be listed here once registered.</p>' }} />
    </LegalStub>
  );
}
