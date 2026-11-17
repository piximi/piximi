import { generateUUID } from "core/entities";

import type { EventBus } from "./events";

export type JobKind = "segmentation" | "model-load";

export type JobStatus =
  | "queued"
  | "running"
  | "stopping"
  | "succeeded"
  | "failed"
  | "cancelled";

export type Job = {
  id: string;
  kind: JobKind;
  status: JobStatus;
  /* 0–100, or -1 while indeterminate. */
  progress: number;
  message: string;
  /* Whether `jobs.cancel` can stop it; shown as a control by the UI. */
  cancellable: boolean;
  error?: string;
  startedAt: number;
  finishedAt?: number;
};

const TERMINAL: ReadonlySet<JobStatus> = new Set([
  "succeeded",
  "failed",
  "cancelled",
]);

export const isTerminal = (status: JobStatus): boolean => TERMINAL.has(status);

/*
 * Long-running work a backend performs, observable by every client of the
 * session. A job owns an AbortController: `cancel` trips it, and the caller's
 * own signal (from `CallOptions`) is linked to it, so either route stops the
 * work. Every change is announced as a `jobs/didUpdate` event.
 */
export class JobRegistry {
  #jobs = new Map<string, Job>();
  #controllers = new Map<string, AbortController>();
  #bus: EventBus;

  constructor(bus: EventBus) {
    this.#bus = bus;
  }

  start(
    kind: JobKind,
    message: string,
    signal?: AbortSignal,
    options: { cancellable?: boolean } = {},
  ): Job {
    const controller = new AbortController();
    if (signal) {
      if (signal.aborted) controller.abort();
      else
        signal.addEventListener("abort", () => controller.abort(), {
          once: true,
        });
    }
    const job: Job = {
      id: generateUUID(),
      kind,
      status: "running",
      progress: -1,
      message,
      cancellable: options.cancellable ?? true,
      startedAt: Date.now(),
    };
    this.#jobs.set(job.id, job);
    this.#controllers.set(job.id, controller);
    this.#bus.emit({ type: "jobs/didUpdate", job });
    return job;
  }

  signal(id: string): AbortSignal {
    const controller = this.#controllers.get(id);
    if (!controller) throw new Error(`Unknown job ${id}`);
    return controller.signal;
  }

  update(id: string, patch: Partial<Pick<Job, "progress" | "message">>): void {
    const job = this.#jobs.get(id);
    if (!job || isTerminal(job.status)) return;
    const next = { ...job, ...patch };
    this.#jobs.set(id, next);
    this.#bus.emit({ type: "jobs/didUpdate", job: next });
  }

  finish(
    id: string,
    status: Extract<JobStatus, "succeeded" | "failed" | "cancelled">,
    details: Partial<Pick<Job, "message" | "error">> = {},
  ): Job | undefined {
    const job = this.#jobs.get(id);
    if (!job || isTerminal(job.status)) return job;
    const next: Job = {
      ...job,
      ...details,
      status,
      progress: status === "succeeded" ? 100 : job.progress,
      finishedAt: Date.now(),
    };
    this.#jobs.set(id, next);
    this.#controllers.delete(id);
    this.#bus.emit({ type: "jobs/didUpdate", job: next });
    return next;
  }

  cancel(id: string): void {
    const job = this.#jobs.get(id);
    if (!job || isTerminal(job.status)) return;
    this.#controllers.get(id)?.abort();
    const next: Job = { ...job, status: "stopping", message: "Stopping..." };
    this.#jobs.set(id, next);
    this.#bus.emit({ type: "jobs/didUpdate", job: next });
  }

  list(): Job[] {
    return [...this.#jobs.values()];
  }
}
