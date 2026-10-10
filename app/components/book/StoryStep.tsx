"use client";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Progress, Segmented, TextField } from "../brand";
import { bookApi } from "../../lib/book/client";
import { READING_AGE_LABELS, WORDS_PER_PAGE } from "../../lib/book/constants";
import { storyLocked } from "../../lib/book/stepper";
import type { StepProps } from "./types";
import { Notice, Skeleton } from "./ui";

const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/** Story review (UX spec 6d): Sonnet writes the page text, the user edits each page and approves. */
export function StoryStep({ project, run, busy, notify, onApproved }: StepProps & { onApproved: () => void }) {
  const story = project.story;
  const working = project.job?.kind === "story" && (project.job.status === "queued" || project.job.status === "running");
  const failed = !story && !working && project.lastJob?.kind === "story" && project.lastJob.status === "failed";
  const started = useRef(false);

  useEffect(() => {
    if (story || working || failed || started.current) return;
    started.current = true;
    void run(() => bookApi.action(project.id, "generate-story"));
  }, [story, working, failed, run, project.id]);

  if (!story) {
    if (failed) {
      return (
        <div className="gb-narrow">
          <Notice action={{ label: "Try again", onClick: () => void run(() => bookApi.action(project.id, "generate-story")) }}>{project.lastJob?.error ?? "We couldn't write the story."}</Notice>
        </div>
      );
    }
    return (
      <div className="gb-narrow" data-testid="story-loading">
        <section className="gb-panel" aria-busy="true">
          <Progress value={working ? 55 : 10} label="Writing the story" />
          <Skeleton h={28} w="60%" />
          <Skeleton h={90} />
          <Skeleton h={90} />
        </section>
      </div>
    );
  }
  return <StoryEditor key={story.generatedAt} {...{ project, run, busy, notify, onApproved }} />;
}

function StoryEditor({ project, run, busy, notify, onApproved }: Pick<StepProps, "project" | "run" | "busy" | "notify"> & { onApproved: () => void }) {
  const story = project.story!;
  const locked = storyLocked({ story });
  const spreads = story.pages.filter((p) => p.kind === "spread");
  const [title, setTitle] = useState(story.title);
  const [texts, setTexts] = useState<Record<string, string>>(() => Object.fromEntries(spreads.map((p) => [p.id, p.text ?? ""])));
  const [mode, setMode] = useState("Page by page");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lo, hi] = WORDS_PER_PAGE[project.brief.readingAge] ?? [0, 999];
  const ageLabel = READING_AGE_LABELS[project.brief.readingAge] ?? "";

  const persist = async (t: string, x: Record<string, string>) => {
    setSaved("saving");
    try {
      await bookApi.action(project.id, "save-story", { title: t, texts: x });
      setSaved("saved");
    } catch {
      setSaved("idle");
      notify("We couldn't save your changes.", () => void persist(t, x));
    }
  };
  const queue = (t: string, x: Record<string, string>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(t, x), 800);
  };
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const approve = async () => {
    if (timer.current) clearTimeout(timer.current);
    await persist(title, texts);
    if (await run(() => bookApi.action(project.id, "approve-story"))) onApproved();
  };

  return (
    <div className="gb-narrow" data-testid="story-editor">
      <section className="gb-panel">
        <div className="gb-row" style={{ justifyContent: "space-between" }}>
          <h2 className="gb-h2">The story</h2>
          <Segmented options={["Page by page", "Read through"]} value={mode} onChange={setMode} />
        </div>
        <TextField
          label="Title"
          value={title}
          disabled={locked}
          maxLength={80}
          onChange={(e) => {
            setTitle(e.target.value);
            queue(e.target.value, texts);
          }}
        />
        {mode === "Page by page" ? (
          spreads.map((p, i) => {
            const n = words(texts[p.id] ?? "");
            return (
              <div className="gb-page-edit" key={p.id}>
                <div className="gb-page-edit__meta">
                  <span className="gb-label" style={{ margin: 0 }}>
                    Page {i + 1}
                  </span>
                  {n > hi && <Badge tone="draft">A bit long for ages {ageLabel}</Badge>}
                  {n > 0 && n < lo && <Badge tone="draft">A bit short for ages {ageLabel}</Badge>}
                </div>
                <TextField
                  multiline
                  rows={3}
                  aria-label={`Page ${i + 1} text`}
                  value={texts[p.id] ?? ""}
                  disabled={locked}
                  maxLength={1200}
                  hint={`${n} words`}
                  onChange={(e) => {
                    const next = { ...texts, [p.id]: e.target.value };
                    setTexts(next);
                    queue(title, next);
                  }}
                />
              </div>
            );
          })
        ) : (
          <div className="gb-read">
            <h3 className="gb-h2">{title}</h3>
            {spreads.map((p) => (
              <p key={p.id}>{texts[p.id]}</p>
            ))}
          </div>
        )}
      </section>
      <div className="gb-row">
        <Button onClick={approve} disabled={busy || locked || spreads.some((p) => !(texts[p.id] ?? "").trim())} data-testid="approve-story">
          Approve the story
        </Button>
        <span className="gb-small" role="status">
          {saved === "saving" ? "Saving" : saved === "saved" ? "Saved" : "Changes save as you type"}
        </span>
      </div>
    </div>
  );
}
