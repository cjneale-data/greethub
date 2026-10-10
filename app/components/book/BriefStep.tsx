"use client";
import { ART_STYLES, ART_STYLE_IDS, PRICING } from "@greethub/shared";
import { Badge, Button, ChipGroup, Segmented, TextField, Toggle } from "../brand";
import { newCharacterId, type FieldErrors } from "../../lib/book/briefForm";
import { AGE_BAND_LABELS, BOOK_OCCASIONS, OCCASION_LABELS, READING_AGE_LABELS, TONE_LABELS } from "../../lib/book/constants";
import type { BriefForm, CharacterForm } from "../../lib/book/types";

const ROLES = ["Hero", "Sibling", "Parent", "Grandparent", "Friend", "Other"];
const SPECIES = ["Dog", "Cat", "Rabbit", "Bird", "Other"];
const BANDS = ["baby", "toddler", "child", "teen", "adult", "senior"] as const;
const SUGGESTIONS = ["A bedtime adventure in the garden", "The day we all went camping", "A treasure hunt around grandma's house"];
const SWATCH = ["var(--gh-blush)", "var(--gh-marigold)", "var(--gh-plum-tint)", "var(--gh-persimmon-tint)", "var(--gh-cream)", "var(--gh-twine)"];

const byLabel = <T extends string>(labels: Record<T, string>, label: string) => (Object.keys(labels) as T[]).find((k) => labels[k] === label) ?? "";
const price = (c: number) => `$${c / 100}`;

export function BriefStep({
  form,
  setForm,
  errors,
  locked,
  onContinue,
  busy,
}: {
  form: BriefForm;
  setForm: (f: BriefForm) => void;
  errors: FieldErrors;
  locked: boolean;
  onContinue: () => void;
  busy: boolean;
}) {
  const set = <K extends keyof BriefForm>(k: K, v: BriefForm[K]) => setForm({ ...form, [k]: v });
  const setChar = (i: number, patch: Partial<CharacterForm>) => set("characters", form.characters.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const people = form.characters.filter((c) => !c.isPet);
  const pet = form.characters.find((c) => c.isPet);
  const occasionOptions = BOOK_OCCASIONS.map((o) => OCCASION_LABELS[o]);
  const err = (k: string) => errors[k];

  return (
    <div className="gb-stack">
      <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0, minInlineSize: 0, display: "contents" }}>
        <section className="gb-panel" aria-labelledby="idea-h">
          <h2 className="gb-h2" id="idea-h">
            What&apos;s the book for?
          </h2>
          <div>
            <span className="gb-label">The occasion</span>
            <ChipGroup options={occasionOptions} value={OCCASION_LABELS[form.occasion]} onChange={(l) => set("occasion", byLabel(OCCASION_LABELS, l))} />
            {err("occasion") && <p className="gh-field__hint gh-field__hint--error">{err("occasion")}</p>}
          </div>
          {form.occasion === "other" && (
            <TextField label="Tell us the occasion" value={form.occasionOther} onChange={(e) => set("occasionOther", e.target.value)} error={err("occasionOther")} maxLength={80} />
          )}
          <div className="gb-grid2">
            <TextField label="Who is the book for?" placeholder="First name" value={form.recipientName} onChange={(e) => set("recipientName", e.target.value)} error={err("recipientName")} maxLength={60} />
            <TextField label="They are your..." placeholder="grandson, niece, friend" value={form.relationship} onChange={(e) => set("relationship", e.target.value)} error={err("relationship")} maxLength={60} />
          </div>
          <div>
            <span className="gb-label">How old is the reader?</span>
            <ChipGroup options={Object.values(READING_AGE_LABELS)} value={READING_AGE_LABELS[form.readingAge]} onChange={(l) => set("readingAge", byLabel(READING_AGE_LABELS, l))} />
            {err("readingAge") && <p className="gh-field__hint gh-field__hint--error">{err("readingAge")}</p>}
          </div>
          <div>
            <span className="gb-label">What kind of story?</span>
            <ChipGroup options={Object.values(TONE_LABELS)} value={TONE_LABELS[form.tone as keyof typeof TONE_LABELS]} onChange={(l) => set("tone", byLabel(TONE_LABELS, l))} />
            {err("tone") && <p className="gh-field__hint gh-field__hint--error">{err("tone")}</p>}
          </div>
          <div>
            <span className="gb-label">How long?</span>
            <Segmented
              options={[`24 pages, ${price(PRICING.skus.book_24.cents)}`, `32 pages, ${price(PRICING.skus.book_32.cents)}`]}
              value={form.pageCount === 24 ? `24 pages, ${price(PRICING.skus.book_24.cents)}` : `32 pages, ${price(PRICING.skus.book_32.cents)}`}
              onChange={(l) => set("pageCount", l.startsWith("24") ? 24 : 32)}
            />
          </div>
        </section>

        <section className="gb-panel" aria-labelledby="look-h">
          <h2 className="gb-h2" id="look-h">
            Pick a look
          </h2>
          <div className="gb-styles" role="group" aria-label="Art style">
            {ART_STYLE_IDS.map((id, i) => (
              <button key={id} type="button" className="gb-style" aria-pressed={form.artStyle === id} onClick={() => set("artStyle", id)} data-testid={`style-${id}`}>
                <span className="gb-style__swatch" style={{ background: SWATCH[i % SWATCH.length] }} />
                <span className="gb-style__name">{ART_STYLES[id].label}</span>
              </button>
            ))}
          </div>
          {err("artStyle") && <p className="gh-field__hint gh-field__hint--error">{err("artStyle")}</p>}
        </section>

        <section className="gb-panel" aria-labelledby="story-h">
          <h2 className="gb-h2" id="story-h">
            What&apos;s the story?
          </h2>
          <TextField
            multiline
            rows={4}
            label="A real memory, an adventure, a bedtime story. A few sentences is plenty."
            value={form.storyIdea}
            onChange={(e) => set("storyIdea", e.target.value)}
            error={err("storyIdea")}
            maxLength={1500}
          />
          <div className="gb-chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="gh-chip" onClick={() => set("storyIdea", s + ". ")}>
                {s}
              </button>
            ))}
          </div>
          <div className="gb-grid2">
            <TextField label="Where does it happen? (optional)" value={form.settingDetails} onChange={(e) => set("settingDetails", e.target.value)} maxLength={200} />
            <TextField label="Dedication (optional)" placeholder="For Lee, with love" value={form.dedication} onChange={(e) => set("dedication", e.target.value)} maxLength={200} />
          </div>
        </section>

        <section className="gb-panel" aria-labelledby="who-h">
          <h2 className="gb-h2" id="who-h">
            Who&apos;s in the story?
          </h2>
          <p className="gb-small">Add up to four people. You can add a pet after.</p>
          {err("characters") && <p className="gh-field__hint gh-field__hint--error">{err("characters")}</p>}
          {form.characters.map((c, i) =>
            c.isPet ? null : (
              <div className="gb-char" key={c.id} data-testid={`char-${i}`}>
                <div className="gb-char__head">
                  <strong>Person {people.indexOf(c) + 1}</strong>
                  {people.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => set("characters", form.characters.filter((x) => x.id !== c.id))}>
                      Remove
                    </Button>
                  )}
                </div>
                <div className="gb-grid2">
                  <TextField label="Name" value={c.name} onChange={(e) => setChar(i, { name: e.target.value })} error={err(`characters.${i}.name`)} maxLength={60} />
                  <TextField label="Pronouns (optional)" placeholder="she/her" value={c.pronouns} onChange={(e) => setChar(i, { pronouns: e.target.value })} maxLength={20} />
                </div>
                <div>
                  <span className="gb-label">Age</span>
                  <ChipGroup options={BANDS.map((b) => AGE_BAND_LABELS[b])} value={AGE_BAND_LABELS[c.ageBand as keyof typeof AGE_BAND_LABELS]} onChange={(l) => setChar(i, { ageBand: byLabel(AGE_BAND_LABELS, l) })} />
                  {err(`characters.${i}.ageBand`) && <p className="gh-field__hint gh-field__hint--error">{err(`characters.${i}.ageBand`)}</p>}
                </div>
                <div>
                  <span className="gb-label">Role</span>
                  <ChipGroup options={ROLES} value={c.role} onChange={(r) => setChar(i, { role: r })} />
                  {err(`characters.${i}.role`) && <p className="gh-field__hint gh-field__hint--error">{err(`characters.${i}.role`)}</p>}
                </div>
              </div>
            ),
          )}
          {people.length < 4 && (
            <div>
              <Button variant="secondary" onClick={() => set("characters", [...form.characters, { id: newCharacterId(), name: "", ageBand: "", role: "", pronouns: "" }])}>
                + Add another person
              </Button>
            </div>
          )}
          <Toggle
            checked={!!pet}
            onChange={(on) =>
              set("characters", on ? [...form.characters, { id: newCharacterId(), name: "", ageBand: "pet", role: "", pronouns: "", isPet: true }] : form.characters.filter((c) => !c.isPet))
            }
          >
            There&apos;s a pet in the story
          </Toggle>
          {pet && (
            <div className="gb-char">
              <TextField label="Pet's name" value={pet.name} onChange={(e) => setChar(form.characters.indexOf(pet), { name: e.target.value })} error={err(`characters.${form.characters.indexOf(pet)}.name`)} maxLength={40} />
              <div>
                <span className="gb-label">What kind?</span>
                <ChipGroup options={SPECIES} value={pet.role} onChange={(r) => setChar(form.characters.indexOf(pet), { role: r })} />
                {err(`characters.${form.characters.indexOf(pet)}.role`) && <p className="gh-field__hint gh-field__hint--error">Pick one.</p>}
              </div>
            </div>
          )}
        </section>
      </fieldset>

      {locked && <p className="gb-small">The idea is locked once the story is written. To change it, start a new book.</p>}
      <div className="gb-row">
        <Button onClick={onContinue} disabled={busy} data-testid="brief-continue">
          {locked ? "Continue" : "Next: add photos"}
        </Button>
        {!locked && <Badge tone="draft">Your answers are kept on this device</Badge>}
      </div>
    </div>
  );
}
