import type { Metadata } from "next";
import { LegalStub } from "@/components/shop/LegalStub";

export const metadata: Metadata = { title: "Privacy Policy | GreetHub" };

export default function PrivacyPage() {
  return (
    <LegalStub title="Privacy Policy" summary="How we handle your information, in plain words.">
      <div dangerouslySetInnerHTML={{ __html: '<h2>Photos and children</h2><p>Photos are private, used only to draw your card or book, and purged after 90 days unless you save the person. Accounts are for adults, 18 and over.</p><h2 id=\"choices\">Cookies and your privacy choices</h2><p>We use only the cookies the site needs to work: your sign-in and your cart. We run no ad or analytics tags. We honour the Global Privacy Control signal.</p><h2>Your data</h2><p>Download or delete your data any time under Account. See <a className="gs-link" href="/account/delete">Delete account</a>.</p>' }} />
    </LegalStub>
  );
}
