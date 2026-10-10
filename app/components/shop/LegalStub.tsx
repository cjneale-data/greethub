import type { ReactNode } from "react";
import { POLICY_VERSION } from "@/lib/shop/policies";
import { PageTitle } from "./ui";

/** Placeholder legal page. The attorney-reviewed text from docs/legal/05-policies-draft.md replaces `children` before launch. */
export function LegalStub({ title, summary, children }: { title: string; summary: string; children?: ReactNode }) {
  return (
    <div className="gs-page gs-page--narrow gs-legal">
      <PageTitle title={title} lede={summary} />
      <p className="gs-banner" role="note">Draft placeholder. The final wording comes from the legal review in docs/legal and is not live yet. Version {POLICY_VERSION}.</p>
      {children}
    </div>
  );
}
