"use client";
import { Badge, Button, Progress } from "../brand";
import { assetUrl, bookApi } from "../../lib/book/client";
import { allPagesDone, renderPercent } from "../../lib/book/stepper";
import type { StepProps } from "./types";
import { Notice } from "./ui";

const tileName = (id: string) => (id === "cover" ? "Cover" : id === "back" ? "Back" : `Page ${id.slice(1)}`);

/** Render progress (UX spec 6e): the Progress bar is this screen's one persimmon moment; tiles fill in as pages finish. */
export function RenderStep({ project, run, busy, onDone }: StepProps & { onDone: () => void }) {
  const job = project.job;
  const active = !!job && (job.status === "queued" || job.status === "running") && (job.kind === "pages" || job.kind === "reroll");
  const done = allPagesDone(project);
  const total = project.artOrder.length;
  const finished = project.artOrder.filter((id) => project.art[id]?.status === "done").length;
  const percent = renderPercent(project);
  const failedIds = project.artOrder.filter((id) => project.art[id]?.status === "failed");
  const pendingIds = project.artOrder.filter((id) => project.art[id]?.status === "pending");
  const cancelled = !active && project.lastJob?.kind === "pages" && project.lastJob.status === "cancelled";
  const current = project.artOrder.find((id) => project.art[id]?.status === "rendering" || project.art[id]?.status === "redrawing");
  const label = current ? `Drawing ${tileName(current).toLowerCase()} (${project.artOrder.indexOf(current) + 1} of ${total})` : active ? job?.progress.label ?? "Getting ready" : "Waiting";

  const draw = () => void run(() => bookApi.action(project.id, "start-render"));
  const retry = (pageId: string) => void run(() => bookApi.action(project.id, "reroll", { pageId }));

  return (
    <div className="gb-narrow" style={{ maxWidth: 980 }} data-testid="render-step">
      <section className="gb-panel">
        {done ? (
          <>
            <h2 className="gb-h2">Your book is ready to look through.</h2>
            <div className="gb-row">
              <Button onClick={onDone} data-testid="view-proof">
                Look through the book
              </Button>
            </div>
          </>
        ) : (
          <>
            {active ? <Progress value={percent} label={label} /> : <h2 className="gb-h2">{cancelled ? "Drawing paused" : "Drawing the pages"}</h2>}
            <p className="gb-small">You can leave this page. Your book keeps drawing and will be waiting here.</p>
          </>
        )}
        {!active && !done && !cancelled && pendingIds.length > 0 && (
          <div>
            <Button onClick={draw} disabled={busy} data-testid="start-render">
              Draw the book
            </Button>
          </div>
        )}
        {!active && project.lastJob?.kind === "pages" && project.lastJob.status === "failed" && failedIds.length > 0 && (
          <Notice action={{ label: "Try the rest again", onClick: draw }}>{project.lastJob.error ?? "Some pages need another try."}</Notice>
        )}
        {cancelled && (
          <div>
            <Button onClick={draw} disabled={busy}>
              Pick up where we left off
            </Button>
          </div>
        )}
        {total === 0 && <p className="gb-small">No pages yet.</p>}
        <div className="gb-tiles">
          {project.artOrder.map((id) => {
            const a = project.art[id];
            const v = a?.versions[a.current];
            const busyTile = a?.status === "rendering" || a?.status === "redrawing";
            if (a?.status === "failed") {
              return (
                <div className="gb-tile gb-tile--failed" key={id} data-testid={`tile-${id}`} data-status="failed">
                  <strong>{tileName(id)}</strong>
                  <span>We couldn&apos;t draw this one.</span>
                  <Button size="sm" variant="secondary" onClick={() => retry(id)} disabled={busy || active}>
                    Try again
                  </Button>
                </div>
              );
            }
            return (
              <div className={`gb-tile ${!v || busyTile ? "gb-tile--busy" : ""}`.trim()} key={id} data-testid={`tile-${id}`} data-status={a?.status ?? "pending"}>
                {v && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assetUrl(project.id, v.file)} alt={`${tileName(id)} artwork`} loading="lazy" />
                )}
                <span className="gb-tile__name">{tileName(id)}</span>
                {a?.status === "redrawing" && (
                  <span style={{ position: "absolute", top: 6, right: 6 }}>
                    <Badge tone="draft">Redrawing</Badge>
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {active && (
          <div>
            <Button variant="ghost" onClick={() => void run(() => bookApi.action(project.id, "cancel"))} disabled={busy}>
              Cancel
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
