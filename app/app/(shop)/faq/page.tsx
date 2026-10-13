import { PageTitle } from "@/components/shop/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "FAQ | GreetHub",
  description: "How GreetHub cards and picture books get made, what happens to your photos, proofs, page redraws, shipping and refunds.",
  path: "/faq",
});

const FAQ: [string, string][] = [
  ["Do I need an account?", "Not to try one card. You get one free preview as a guest. A free account unlocks picture books, saved drafts, saved people, page redraws on books, full-size proofs, checkout and order tracking. Accounts are for adults, 18 and over."],
  ["How does the card get made?", "You tell the Greet Guide who it's for, the occasion and what you'd say. We draw it and show you a preview. You change what you like, then approve."],
  ["Can I make a card without the chat?", "Yes. Switch to Form and fill the same questions in a short list."],
  ["What do you do with my photos?", "Cards don't use photos. Book photos are private, used only to draw your book and check it for safety, and deleted 90 days after upload. If you tick \"Keep my approved character\", we keep that book's photos until you delete your account. Until the characters are drawn, you can also withdraw consent on the photo step, which deletes them."],
  ["Can I use photos of my kids?", "Yes, if you're their parent or guardian, or have their parent or guardian's OK. We ask you to confirm when you upload."],
  ["Can you draw Mickey, Elsa or other characters?", "No. We can't use copyrighted characters or real public figures. We'll offer a look-alike idea that's all yours, like \"a cheerful cartoon mouse.\""],
  ["Will it really look like us?", "You approve the character sheet before any page is drawn, so you see how everyone looks first. If something's off, you redo it."],
  ["What if a picture comes out wrong?", "Redraw it. Each picture book comes with 3 page redraws and 2 free redos of the character sheet, and a drawing that fails never uses one up."],
  ["How long does delivery take?", "We'll show an estimated date at checkout once you've entered the address. Cards and books are printed to order."],
  ["Can you mail it straight to the person?", "Yes. Pick \"To someone else\" at checkout and add the address. We don't put prices on anything we send."],
  ["Can I change it after I pay?", "Not once it's printing. Look closely at the proof first. If you spot a problem right away, contact us and we'll do what we can."],
  ["What if it arrives damaged or wrong?", "Tell us within 30 days with a photo and we'll reprint or refund."],
  ["Is the art made by AI?", "Yes. The pictures are drawn by AI image models from your brief and photos, then laid out and printed by us. We say so plainly. You always see it before it prints."],
  ["Can I sell what I make or use it commercially?", "For personal use, it's yours. For business use, email us first."],
  ["Which countries do you ship to?", "We ship to the US to start. More countries soon."],
  ["Can I order from ChatGPT, Claude or Gemini?", "Not yet. We are building a way to draft a card from your AI assistant, where you still approve and pay on greethub.com. See \"Order from your AI assistant\" in the footer."],
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
