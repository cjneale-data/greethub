import { describe, expect, it } from "vitest";
import { PHOTO_GUEST_MESSAGE, PUBLIC_FIGURE_MESSAGE, SENSITIVE_MESSAGE, checkDraft, checkText, guestPhotoViolation, rewriteCopyrighted } from "@/lib/intake/guardrails";

describe("guardrails", () => {
  it("rewrites copyrighted characters to generic descriptions", () => {
    expect(rewriteCopyrighted("a card like Meeko eating a cupcake").text).toBe("a card like a friendly raccoon eating a cupcake");
    expect(rewriteCopyrighted("Elsa and Spider-Man").text).toBe("an ice queen with a braid and a masked hero in a red and blue suit");
    expect(rewriteCopyrighted("a cheerful picnic").hits).toHaveLength(0);
  });

  it("does not double the noun when the user already named the animal", () => {
    expect(rewriteCopyrighted("Meeko the raccoon in her garden").text).toBe("a friendly raccoon in her garden");
  });

  it("never leaves the trademark name in the rewritten text", () => {
    const v = checkText("Mickey Mouse wearing a Nike cap");
    expect(v.ok).toBe(false);
    if (!v.ok && v.kind === "copyright") {
      expect(v.rewritten.toLowerCase()).not.toContain("mickey");
      expect(v.rewritten.toLowerCase()).not.toContain("nike");
      expect(v.message).toContain("I can't draw");
    } else {
      throw new Error("expected a copyright verdict");
    }
  });

  it("uses the logo wording for brand-only hits", () => {
    const v = checkText("Wearing Gucci shoes");
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.message).toContain("leave the logo off");
  });

  it("blocks real public figures with the exact wording", () => {
    expect(checkText("Taylor Swift singing on a hill")).toMatchObject({ ok: false, kind: "public_figure", message: PUBLIC_FIGURE_MESSAGE });
  });

  it("blocks sensitive content but allows grief vocabulary for sympathy cards", () => {
    expect(checkText("kill him with a bomb")).toMatchObject({ ok: false, kind: "sensitive", message: SENSITIVE_MESSAGE });
    expect(checkText("Sorry that Grandpa passed away. He loved his garden.").ok).toBe(true);
  });

  it("does not flag first names that match a character", () => {
    expect(checkDraft({ recipientName: "Elsa", relationship: "Grandparent" }).ok).toBe(true);
    expect(checkDraft({ idea: "Elsa at the beach" }).ok).toBe(false);
  });

  it("checks every free-text field and reports which one failed", () => {
    const r = checkDraft({ idea: "A hill", message: "Hi", avoid: "Pikachu" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("avoid");
  });

  it("strips control characters", () => {
    expect(checkText("hello\u0000 world\u0007")).toEqual({ ok: true, text: "hello world" });
  });

  it("refuses photo references for guests", () => {
    expect(guestPhotoViolation({ characters: [{ photoIds: ["p1"] }] })).toBe(PHOTO_GUEST_MESSAGE);
    expect(guestPhotoViolation({ placePhotoIds: ["p1"] })).toBe(PHOTO_GUEST_MESSAGE);
    expect(guestPhotoViolation({})).toBeNull();
  });
});
