import type { Metadata } from "next";
import { LegalStub } from "@/components/shop/LegalStub";

export const metadata: Metadata = { title: "Acceptable Use | GreetHub" };

export default function AcceptableUsePage() {
  return (
    <LegalStub title="Acceptable Use" summary="What you can and can't make here.">
      <div dangerouslySetInnerHTML={{ __html: '<p>No copyrighted characters, real public figures, or content that is hateful, sexual or harmful. Photos of children only from their parent or guardian, or with their OK.</p>' }} />
    </LegalStub>
  );
}
