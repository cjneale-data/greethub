import Link from "next/link";
import type { Metadata } from "next";
import { Badge, ButtonLink } from "@/components/brand";
import { PageTitle } from "@/components/shop/ui";

export const metadata: Metadata = {
  title: "Order from your AI assistant | GreetHub",
  description: "Coming soon: ask your AI assistant to draft a GreetHub card. You approve it and pay on greethub.com.",
};

const STEPS: [string, string][] = [
  ["Connect once.", "Add GreetHub to your assistant and sign in to your GreetHub account. You choose what it may do."],
  ["Ask in your own words.", "“Make a thank-you card for Dana and mail it Friday.” The assistant drafts it with GreetHub."],
  ["You approve and pay.", "We send you to a GreetHub page that shows the exact card, who it goes to and the price. Nothing prints until you say yes."],
];

const CONTROLS: [string, string][] = [
  ["You approve by default.", "Your assistant can draft a card and ask. Only you can approve it and pay, on greethub.com."],
  ["Limits you set.", "Set a most-per-card amount and monthly limits for each assistant. Anything over a limit waits for you."],
  ["Hands-off is opt-in.", "If you ever want an assistant to send to people you have listed, you turn that on yourself on the website, and there is a 24-hour wait before it starts. The assistant cannot turn it on."],
  ["See everything.", "A Connected assistants page in your account lists what each one did and spent. Revoke one, or pause them all, any time."],
];

const FAQ: [string, string][] = [
  ["Is this available now?", "Not yet. We are building it and will open it in stages. Cards come first. We will post here when it is ready."],
  ["Which assistants will it work with?", "We are designing it for assistants that can connect to outside services using the MCP standard, which includes ChatGPT, Claude and Gemini. Which ones can add GreetHub, and when, depends on each company’s rules and we do not control that. We will list only what is working."],
  ["Can I order a picture book this way?", "Not at first. Picture books need you to approve the characters, so they stay on greethub.com for now. Cards only to start."],
  ["Can my assistant use my photos or my kids’ photos?", "No. The assistant cannot upload or see photos. People you have saved with photos are not available to assistants at launch."],
  ["Does the assistant see my address book?", "No. It can see names, not addresses. New addresses are confirmed by you on the approval page."],
  ["What does GreetHub learn from the assistant?", "Only what the assistant passes along to make the card, like the occasion and what to say. We do not get your calendar, contacts or chat history. We remove emails, phone numbers and links from what comes in."],
  ["What if the assistant gets it wrong?", "Nothing is charged until you approve. If the draft is off, ask for changes or decline it."],
  ["Does it cost extra?", "No. Same card prices as the rest of the site. See Pricing."],
  ["Can I disconnect an assistant?", "Yes. Revoke it from your account and it stops working right away."],
];

export default function AssistantsPage() {
  return (
    <div className="gs-page gs-page--narrow">
      <div style={{ marginBottom: 12 }}><Badge tone="new">Coming soon</Badge></div>
      <PageTitle title="Ask your assistant. We make the card." lede="Soon you will be able to start a GreetHub card from the AI assistant you already use. You stay in charge of what gets approved and paid for." />

      <div className="gs-stack gs-stack--lg">
        <section>
          <h2 className="gs-h2">How it will work</h2>
          <div className="gs-steps">
            {STEPS.map(([h, p]) => (
              <div key={h} className="gs-step"><h3 className="gs-h3">{h}</h3><p>{p}</p></div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="gs-h2">Works with the assistants you use</h2>
          <p className="gs-lede">
            We are building GreetHub to connect to ChatGPT, Claude, Gemini and other assistants that support the MCP standard. Each company decides what it lets people add, so we will say here exactly which ones work as they open up. For now, none do.
          </p>
        </section>

        <section>
          <h2 className="gs-h2">You stay in control</h2>
          <div className="gs-stack gs-stack--sm">
            {CONTROLS.map(([h, p]) => (
              <div key={h} className="gs-panel gs-panel--flat"><h3 className="gs-h3">{h}</h3><p className="gs-muted" style={{ margin: 0 }}>{p}</p></div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="gs-h2">Privacy and safety</h2>
          <ul className="gs-muted">
            <li>No photo access for assistants.</li>
            <li>No addresses shown to assistants.</li>
            <li>Same rules as everything else we make: no copyrighted characters or real public figures. See <Link className="gs-link" href="/acceptable-use">Acceptable use</Link>.</li>
            <li>What a card is made from is handled under our <Link className="gs-link" href="/privacy">Privacy policy</Link>. Your assistant&apos;s own company has its own policy for what you tell it.</li>
            <li>The art is drawn by AI, and you always see it before it prints.</li>
          </ul>
        </section>

        <section>
          <h2 className="gs-h2">Questions, answered.</h2>
          <div className="gs-faq gs-stack gs-stack--sm">
            {FAQ.map(([q, a]) => (
              <details key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </section>

        <div className="gs-row">
          <ButtonLink variant="dark" href="/create/card">Start a card now</ButtonLink>
          <ButtonLink variant="secondary" href="/pricing">See pricing</ButtonLink>
        </div>
      </div>
    </div>
  );
}
