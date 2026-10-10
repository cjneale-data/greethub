"use client";
import { useRef, useState } from "react";
import { Avatar, Button } from "../brand";
import { CONSENT_TEXT, PHOTO_PRIVACY_LINE, consentValid, emptyBoxes, evaluateConsentGate, requiredBoxesTicked } from "../../lib/book/consent";
import { MAX_PHOTOS_PER_CHARACTER } from "../../lib/book/constants";
import { bookApi, photoUrl } from "../../lib/book/client";
import { PhotoError, prepareImage } from "../../lib/book/downscale";
import type { ProjectView } from "../../lib/book/types";
import type { StepProps } from "./types";
import { Checkbox } from "./ui";

type Pending = { key: string; name: string; status: "working" | "error"; message?: string };

/** Photos and consent (UX spec 6b, docs/legal/06 section A): consent log first, then uploads, then Continue. */
export function PhotosStep({ project, run, setProject, busy, locked, onNext, notify }: StepProps & { locked: boolean; onNext: () => void }) {
  const [boxes, setBoxes] = useState(emptyBoxes());
  const [pending, setPending] = useState<Record<string, Pending[]>>({});
  const consented = consentValid(project.consent);
  const gate = evaluateConsentGate(project.brief, project.photos, consented ? project.consent!.boxes : null);
  const uploading = Object.values(pending).some((l) => l.some((p) => p.status === "working"));
  const firstProblem = gate.problems.find((p) => p.code !== "no_consent");

  const saveConsent = () => run(() => bookApi.recordConsent(project.id, boxes));

  return (
    <div className="gb-stack">
      <section className="gb-panel" aria-labelledby="consent-h">
        <h2 className="gb-h2" id="consent-h">
          Before you add photos
        </h2>
        <p className="gb-small">{PHOTO_PRIVACY_LINE}</p>
        {consented ? (
          <div className="gb-stack" data-testid="consent-saved">
            <div className="gb-notice gb-notice--info" role="status">
              <p className="gb-notice__text">Thanks. Your choices are saved{project.consent!.boxes.c ? ", and we'll keep your characters for reuse" : ""}.</p>
              {!locked && (
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => confirm("Withdrawing deletes every photo you added to this book. Pages already drawn stay. Continue?") && run(() => bookApi.action(project.id, "withdraw-consent"))}>
                  Withdraw consent and delete photos
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="gb-consent" data-testid="consent-form">
            <Checkbox checked={boxes.a} onChange={(a) => setBoxes({ ...boxes, a })} id="consent-a">
              {CONSENT_TEXT.a}
            </Checkbox>
            <Checkbox checked={boxes.b} onChange={(b) => setBoxes({ ...boxes, b })} id="consent-b">
              {CONSENT_TEXT.b}{" "}
              <a href="/privacy" target="_blank" rel="noreferrer">
                How we handle children&apos;s photos
              </a>
            </Checkbox>
            <Checkbox checked={boxes.c} onChange={(c) => setBoxes({ ...boxes, c })}>
              {CONSENT_TEXT.c} (optional)
            </Checkbox>
            <Checkbox checked={boxes.d} onChange={(d) => setBoxes({ ...boxes, d })}>
              {CONSENT_TEXT.d} (optional)
            </Checkbox>
            <div className="gb-row">
              <Button variant="secondary" onClick={saveConsent} disabled={!requiredBoxesTicked(boxes) || busy} data-testid="consent-save">
                Save my choices and add photos
              </Button>
              {!requiredBoxesTicked(boxes) && <span className="gb-small">Tick the first two boxes to add photos.</span>}
            </div>
          </div>
        )}
      </section>

      <section className="gb-panel" aria-labelledby="who-h">
        <h2 className="gb-h2" id="who-h">
          Who&apos;s in the book?
        </h2>
        <p className="gb-small">One clear face per photo works best. JPG, PNG or HEIC, at least 600 pixels on the short side.</p>
        {project.brief.characters.map((c, idx) => {
          const mine = project.photos.filter((p) => p.characterId === c.id);
          const wait = pending[c.id] ?? [];
          return (
            <CharacterPhotos
              key={c.id}
              index={idx}
              name={c.name}
              optional={!!c.isPet}
              photos={mine}
              pending={wait}
              disabled={!consented || locked || busy}
              projectId={project.id}
              onFiles={async (files) => {
                const room = MAX_PHOTOS_PER_CHARACTER - mine.length;
                const list = files.slice(0, Math.max(0, room));
                if (files.length > list.length) notify(`Up to ${MAX_PHOTOS_PER_CHARACTER} photos each.`);
                for (const f of list) {
                  const key = `${f.name}-${f.size}-${Math.random()}`;
                  setPending((s) => ({ ...s, [c.id]: [...(s[c.id] ?? []), { key, name: f.name, status: "working" }] }));
                  const drop = () => setPending((s) => ({ ...s, [c.id]: (s[c.id] ?? []).filter((p) => p.key !== key) }));
                  try {
                    const { blob } = await prepareImage(f);
                    const next = await bookApi.uploadPhoto(project.id, c.id, blob);
                    setProject(next);
                    drop();
                  } catch (e) {
                    const message = e instanceof PhotoError || e instanceof Error ? e.message : "That didn't work. Try another photo.";
                    setPending((s) => ({ ...s, [c.id]: (s[c.id] ?? []).map((p) => (p.key === key ? { ...p, status: "error", message } : p)) }));
                  }
                }
              }}
              onRemove={(photoId) => run(() => bookApi.removePhoto(project.id, photoId))}
              onDismiss={(key) => setPending((s) => ({ ...s, [c.id]: (s[c.id] ?? []).filter((p) => p.key !== key) }))}
            />
          );
        })}
      </section>

      <div className="gb-row">
        <Button onClick={onNext} disabled={!gate.ok || uploading || busy} data-testid="photos-continue">
          {project.photosConfirmed ? "Continue" : "Next: the story"}
        </Button>
        {!gate.ok && (
          <span className="gb-small" data-testid="gate-hint">
            {consented ? firstProblem?.message : "Save your consent choices first."}
          </span>
        )}
      </div>
    </div>
  );
}

function CharacterPhotos({
  index,
  name,
  optional,
  photos,
  pending,
  disabled,
  projectId,
  onFiles,
  onRemove,
  onDismiss,
}: {
  index: number;
  name: string;
  optional: boolean;
  photos: ProjectView["photos"];
  pending: Pending[];
  disabled: boolean;
  projectId: string;
  onFiles: (f: File[]) => void;
  onRemove: (photoId: string) => void;
  onDismiss: (key: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div className="gb-char" data-testid={`photos-${index}`}>
      <div className="gb-char__head">
        <span className="gb-row">
          <Avatar name={name} index={index} size={40} />
          <strong>{name}</strong>
        </span>
        <span className="gb-small">{optional ? "Photo optional" : `${photos.length} of ${MAX_PHOTOS_PER_CHARACTER}`}</span>
      </div>
      {(photos.length > 0 || pending.length > 0) && (
        <div className="gb-thumbs">
          {photos.map((p) => (
            <div className="gb-thumb" key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl(projectId, p.id)} alt={`Photo of ${name}`} />
              {!disabled && (
                <button type="button" className="gb-thumb__x" aria-label={`Remove photo of ${name}`} onClick={() => onRemove(p.id)}>
                  ×
                </button>
              )}
            </div>
          ))}
          {pending.map((p) =>
            p.status === "working" ? (
              <div className="gb-thumb gb-skel" key={p.key} role="status" aria-label="Preparing photo">
                Preparing
              </div>
            ) : (
              <div className="gb-thumb gb-thumb--error" key={p.key} role="alert">
                <span>{p.message}</span>
                <button type="button" className="gh-btn gh-btn--ghost gh-btn--sm" onClick={() => onDismiss(p.key)}>
                  Remove
                </button>
              </div>
            ),
          )}
        </div>
      )}
      {photos.length < MAX_PHOTOS_PER_CHARACTER && (
        <>
          <button
            type="button"
            className="gb-drop"
            disabled={disabled}
            data-over={over}
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              if (!disabled) onFiles(Array.from(e.dataTransfer.files));
            }}
            data-testid={`drop-${index}`}
          >
            <strong>Add photos of {name || "this person"}</strong>
            <span className="gb-small">{disabled ? "Save your consent choices first" : "Tap to choose, or drop them here"}</span>
          </button>
          <input
            ref={input}
            type="file"
            hidden
            multiple
            accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif"
            data-testid={`file-${index}`}
            onChange={(e) => {
              onFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </>
      )}
    </div>
  );
}
