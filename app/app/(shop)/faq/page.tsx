import type { Metadata } from "next";
import { PageTitle } from "@/components/shop/ui";

export const metadata: Metadata = { title: "FAQ | GreetHub" };

const FAQ: [string, string][] = [
  ["Do I need an account?", "Not to try one card. You get one free preview as a guest. A free account unlocks picture books, saved drafts, saved people, re-rolls, full-size proofs, checkout and order tracking. Accounts are for adults, 18 and over."],
  ["How does the card get made?", "You tell the Greet Guide who it's for, the occasion and what you'd say. We draw it and show you a preview. You change what you like, then approve."],
  ["Can I make a card without the chat?", "Yes. Switch to Form and fill the same questions in a short list."],
  ["What do you do with my photos?", "They're private, used only to draw your card or book, and deleted after 90 days unless you save the person for next time. You can delete them or your whole account any time."],
  ["Can I use photos of my kids?", "Yes, if you're their parent or guardian, or have their parent or guardian's OK. We ask you to confirm when you upload."],
  ["Can you draw Mickey, Elsa or other characters?", "No. We can't use copyrighted characters or real public figures. We'll offer a look-alike idea that's all yours, like \"a cheerful cartoon mouse.\""],
  ["Will it really look like us?", "You approve the character sheet before any page is drawn, so you see how everyone looks first. If something's off, you redo it."],
  ["What if a picture comes out wrong?", "Use a re-roll to redraw it. Accounts get re-rolls every month."],
  ["How long does delivery take?", "We'll show an estimated date at checkout once you've entered the address. Cards and books are printed to order."],
  ["Can you mail it straight to the person?", "Yes. Pick \"To someone else\" at checkout and add the address. We don't put prices on anything we send."],
  ["Can I change it after I pay?", "Not once it's printing. Look closely at the proof first. If you spot a problem right away, contact us and we'll do what we can."],
  ["What if it arrives damaged or wrong?", "Tell us within 30 days with a photo and we'll reprint or refund."],
  ["Is the art made by AI?", "Yes. The pictures are drawn by AI image models from your brief and photos, then laid out and printed by us. We say so plainly. You always see it before it prints."],
  ["Can I sell what I make or use it commercially?", "For personal use, it's yours. For business use, email us first."],
  ["Which countries do you ship to?", "We ship to the US to start. More countries soon."],
  ["How do I delete my account?", "Account, then Delete account. It removes your profile, saved people, photos, drafts and addresses. You can also download your data first."],
];

export default function FaqPage() {
  return (
    <div className="gs-page gs-page--narrow">
      <PageTitle title="Questions, answered." />
      <div className="gs-faq gs-stack gs-stack--sm">
        {FAQ.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
