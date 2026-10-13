"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Chip, Progress, Toast } from "../brand";
import { ApiError, bookApi, type DraftSummary, type SessionInfo } from "../../lib/book/client";
import { emptyBriefForm, validateBriefForm, type FieldErrors } from "../../lib/book/briefForm";
import { STEPS, STEP_TITLES, briefLocked, canEnter, currentStep, photosLocked, stepLabel, type StepId } from "../../lib/book/stepper";
import type { BriefForm, ProjectView } from "../../lib/book/types";
import "./book.css";
import { BriefStep } from "./BriefStep";
import { PhotosStep } from "./PhotosStep";
import { ProofStep } from "./ProofStep";
import { RenderStep } from "./RenderStep";
import { SheetStep } from "./SheetStep";
import { SignInGate } from "./SignInGate";
import { StoryStep } from "./StoryStep";
import { Notice, Skeleton } from "./ui";

const DRAFT_KEY = "greethub:book-draft:v1";

const readDraft = (): BriefForm | null => {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? ({ ...emptyBriefForm(), ...JSON.parse(raw) } as BriefForm) : null;
  } catch {
    return null;
  }
};
const writeDraft = (f: BriefForm | null) => {
  try {
    if (f) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(f));
    else window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage can be blocked; the form still works */
  }
};

const isActive = (p: ProjectView | null) => !!p?.job && (p.job.status === "queued" || p.job.status === "running");

export function BookCreator() {
  const router = useRouter();
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [project, setProjectState] = useState<ProjectView | null>(null);
  const [form, setFormState] = useState<BriefForm>(emptyBriefForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [step, setStep] = useState<StepId>("brief");
  const [busy, setBusy] = useState(false);
  const [gate, setGate] = useState(false);
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [toast, setToast] = useState<{ message: string; retry?: () => void; label?: string } | null>(null);
  const [loadError, setLoadError] = useState("");

  const notify = useCallback((message: string, retry?: () => void) => setToast({ message, retry }), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.retry ? 12000 : 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const setForm = (f: BriefForm) => {
    setFormState(f);
    writeDraft(f);
    // once errors are showing, keep them in step with what the user fixes
    if (Object.keys(errors).length) setErrors(validateBriefForm(f).errors);
  };

  const setProject = useCallback((p: ProjectView | null) => {
    setProjectState(p);
    const url = new URL(window.location.href);
    if (p) url.searchParams.set("p", p.id);
    else url.searchParams.delete("p");
    window.history.replaceState(null, "", url.toString());
  }, []);

  /* ---------- boot ---------- */
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const s = await bookApi.session();
        if (dead) return;
        setSession(s);
        const saved = readDraft();
        if (saved) setFormState(saved);
        const pid = new URL(window.location.href).searchParams.get("p");
        if (s.signedIn) {
          if (pid) {
            try {
              const p = await bookApi.getProject(pid);
              if (dead) return;
              setProjectState(p);
              setFormState(p.brief);
              setStep(currentStep(p));
            } catch (e) {
              if (!(e instanceof ApiError && e.status === 404)) throw e;
              window.history.replaceState(null, "", window.location.pathname);
            }
          } else {
            setDrafts((await bookApi.listProjects()).filter((d) => !d.approved).slice(0, 3));
          }
        }
        if (!dead) setPhase("ready");
      } catch (e) {
        if (!dead) {
          setLoadError((e as Error).message);
          setPhase("error");
        }
      }
    })();
    return () => {
      dead = true;
    };
  }, []);

  /* ---------- polling while a job runs ---------- */
  const active = isActive(project);
  const pid = project?.id;
  useEffect(() => {
    if (!active || !pid) return;
    let dead = false;
    const every = session?.mock ? 700 : 2000;
    const t = setInterval(async () => {
      try {
        const p = await bookApi.getProject(pid);
        if (!dead) setProjectState(p);
      } catch {
        /* a missed poll is fine; the next one catches up */
      }
    }, every);
    return () => {
      dead = true;
      clearInterval(t);
    };
  }, [active, pid, session?.mock]);

  /* ---------- derived ---------- */
  const stepperInput = project;
  const furthest = project ? currentStep(project) : "brief";
  async function run(fn: () => Promise<ProjectView>): Promise<boolean> {
    setBusy(true);
    try {
      const p = await fn();
      setProject(p);
      if (p.ipNotices?.length) {
        // Rewritten text is shown in the form so the customer can edit it; the note says what changed.
        setFormState(p.brief);
        notify(p.ipNotices[0]);
      }
      return true;
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 401) setGate(true);
      else notify(err.message || "Something went wrong. Try again.", err.code === "offline" ? () => void run(fn) : undefined);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const goto = useCallback((s: StepId) => {
    setStep(s);
    window.scrollTo({ top: 0 });
  }, []);

  /* ---------- step 1 ---------- */
  const onBriefContinue = async () => {
    const v = validateBriefForm(form);
    setErrors(v.errors);
    if (!v.ok) {
      notify("A few answers still need a look.");
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid=true], .gh-field__hint--error")?.scrollIntoView({ block: "center", behavior: "smooth" }));
      return;
    }
    if (project && briefLocked(project)) return goto(furthest);
    if (!session?.signedIn) {
      setGate(true);
      return;
    }
    const ok = await run(() => (project ? bookApi.updateBrief(project.id, form) : bookApi.createProject(form)));
    if (ok) goto("photos");
  };

  const devSignIn = async () => {
    setBusy(true);
    try {
      await bookApi.devSignIn();
      setSession(await bookApi.session());
      setGate(false);
      notify("Signed in with the local test account. Press Next again.");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onPhotosNext = async () => {
    if (!project) return;
    if (project.photosConfirmed || (await run(() => bookApi.action(project.id, "confirm-photos")))) goto("story");
  };

  const startOver = () => {
    writeDraft(null);
    setForm(emptyBriefForm());
    setProject(null);
    setStep("brief");
    setErrors({});
  };

  const stepProps = project && session ? { project, session, run, setProject: (p: ProjectView) => setProjectState(p), busy, notify } : null;

  /* ---------- render ---------- */
  if (phase === "loading") {
    return (
      <div className="gb-narrow" aria-busy="true" data-testid="creator-loading">
        <Skeleton h={40} w="70%" />
        <Skeleton h={14} />
        <Skeleton h={320} />
      </div>
    );
  }
  if (phase === "error" || !session) {
    return (
      <div className="gb-narrow">
        <Notice action={{ label: "Try again", onClick: () => window.location.reload() }}>{loadError || "We couldn't load the book maker."}</Notice>
      </div>
    );
  }

  const idx = STEPS.indexOf(step);
  const renderingScreen = step === "render" && !(project && project.artOrder.every((id) => project.art[id]?.status === "done"));

  return (
    <div className="gb-page" data-testid="book-creator" data-step={step}>
      <header className="gb-steps">
        <h1 className="gb-h1">
          {step === "brief" ? (
            <>
              Make a <em>picture book</em>
            </>
          ) : (
            STEP_TITLES[step]
          )}
        </h1>
        {session.mock && (
          <div className="gb-demo">
            <Badge tone="draft">Demo mode: placeholder art, no cost</Badge>
          </div>
        )}
        <div className="gb-stack" style={{ gap: "var(--gh-s-2)" }}>
          {renderingScreen ? <span className="gb-steplabel">{stepLabel(step)}</span> : <Progress value={((idx + 1) / STEPS.length) * 100} label={stepLabel(step)} />}
        </div>
        <nav className="gb-stepnav" aria-label="Steps" tabIndex={0}>
          {STEPS.map((s) => {
            const open = s === "brief" || canEnter(s, stepperInput);
            return (
              <Chip key={s} selected={s === step} disabled={!open || (s === "brief" && !project && step === "brief")} onClick={() => goto(s)} aria-current={s === step ? "step" : undefined}>
                {STEP_TITLES[s]}
              </Chip>
            );
          })}
        </nav>
      </header>

      {step === "brief" && !project && drafts.length > 0 && (
        <section className="gb-panel gb-panel--flat" aria-label="Your drafts">
          <h2 className="gb-h2">Pick up where you left off</h2>
          {drafts.map((d) => (
            <div className="gb-draft" key={d.id}>
              <span>
                <strong>{d.title}</strong> <span className="gb-small">({d.step})</span>
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  const p = await bookApi.getProject(d.id);
                  setProject(p);
                  setFormState(p.brief);
                  setStep(currentStep(p));
                }}
              >
                Continue
              </Button>
            </div>
          ))}
        </section>
      )}

      {step === "brief" && (
        <div className="gb-narrow">
          <BriefStep form={form} setForm={setForm} errors={errors} locked={!!project && briefLocked(project)} onContinue={onBriefContinue} busy={busy} />
          {gate && <SignInGate devSignin={session.devSignin} onDevSignIn={devSignIn} onClose={() => setGate(false)} busy={busy} />}
        </div>
      )}

      {step === "photos" && stepProps && (
        <div className="gb-narrow">
          <PhotosStep {...stepProps} locked={photosLocked(stepProps.project)} onNext={onPhotosNext} />
        </div>
      )}
      {step === "story" && stepProps && <StoryStep {...stepProps} onApproved={() => goto("sheet")} />}
      {step === "sheet" && stepProps && <SheetStep {...stepProps} onApproved={() => goto("render")} />}
      {step === "render" && stepProps && <RenderStep {...stepProps} onDone={() => goto("proof")} />}
      {step === "proof" && stepProps && <ProofStep {...stepProps} onAdded={() => router.push("/cart")} />}

      {(step !== "brief" || project) && (
        <div>
          <Button variant="ghost" size="sm" onClick={startOver}>
            Start a new book
          </Button>
        </div>
      )}

      {toast && (
        <div className="gb-toastbar" role="status" aria-live="polite">
          <Toast action={toast.label ?? (toast.retry ? "Retry" : "Close")} onAction={() => (toast.retry ? toast.retry() : setToast(null))}>
            {toast.message}
          </Toast>
        </div>
      )}
    </div>
  );
}
