import type { Metadata } from "next";
import { LegalStub } from "@/components/shop/LegalStub";

export const metadata: Metadata = { title: "Privacy Policy | GreetHub" };

export default function PrivacyPage() {
  return (
    <LegalStub title="Privacy Policy" summary="How we handle your information, in plain words.">
      <div dangerouslySetInnerHTML={{ __html: '<h2>Photos and children</h2><p>Cards don&apos;t use photos. Photos you add to a picture book are private, used only to draw that book and to check it for safety, and deleted 90 days after upload. If you tick &ldquo;Keep my approved character&rdquo;, we keep that book&apos;s photos until you delete your account. Until the characters are drawn, you can also withdraw consent on the photo step, which deletes the photos. Accounts are for adults, 18 and over.</p><h2 id=\"choices\">Cookies and your privacy choices</h2><p>We use only the cookies the site needs to work: your sign-in, your cart, your one free card preview, and whether you closed the cookie notice. We run no ad or analytics tags. We honour the Global Privacy Control signal.</p><h2>Your data</h2><p>Download or delete your data any time under Account. See <a class="gs-link" href="/account/delete">Delete account</a>.</p>' }} />
    </LegalStub>
  );
}
