import type { SessionInfo } from "../../lib/book/client";
import type { ProjectView } from "../../lib/book/types";

/** What every step component gets from the BookCreator shell. */
export type StepProps = {
  project: ProjectView;
  session: SessionInfo;
  /** Runs a server action, shows errors as a toast with retry, updates the project. Resolves true on success. */
  run: (fn: () => Promise<ProjectView>) => Promise<boolean>;
  setProject: (p: ProjectView) => void;
  busy: boolean;
  notify: (message: string, retry?: () => void) => void;
};
