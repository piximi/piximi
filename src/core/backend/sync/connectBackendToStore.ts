import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { taskCancelRegistry } from "store/appTasks/taskCancelRegistry";
import { dataSlice } from "store/data";

import { isTerminal } from "../jobs";

import type { AppTaskType } from "store/appTasks/types";

import type { BackendEvent } from "../events";
import type { Job, JobKind } from "../jobs";
import type { StoreHandle } from "../local/store";
import type { Backend } from "../types";

const taskType: Record<JobKind, AppTaskType> = {
  segmentation: "image-segmentation",
  "model-load": "model-load",
};

/*
 * Backend jobs are the task list: every client of a session sees the same
 * runs, with their progress, and can stop them. The toast's cancel control
 * goes through the registry to `backend.jobs.cancel`.
 */
const applyJobUpdate = (job: Job, backend: Backend, store: StoreHandle) => {
  const { dispatch } = store;
  const known = job.id in store.getState().appTasks.tasks;
  if (!known) {
    // A job that ended before this client saw it has nothing to show.
    if (isTerminal(job.status)) return;
    dispatch(
      appTasksSlice.actions.taskRegistered({
        id: job.id,
        type: taskType[job.kind],
        status: "running",
        progress: job.progress,
        label: job.message,
        cancellable: job.cancellable,
        startedAt: job.startedAt,
      }),
    );
    if (job.cancellable) {
      taskCancelRegistry.register(
        job.id,
        () => void backend.jobs.cancel(job.id),
      );
    }
    return;
  }
  switch (job.status) {
    case "queued":
    case "running":
      dispatch(
        appTasksSlice.actions.taskUpdated({
          id: job.id,
          progress: job.progress,
          label: job.message,
        }),
      );
      return;
    case "stopping":
      dispatch(
        appTasksSlice.actions.taskUpdated({
          id: job.id,
          progress: job.progress,
          status: "stopping",
          label: job.message,
        }),
      );
      return;
    case "succeeded":
      dispatch(
        appTasksSlice.actions.taskCompleted({ id: job.id, label: job.message }),
      );
      break;
    case "failed":
      dispatch(
        appTasksSlice.actions.taskFailed({
          id: job.id,
          error: job.error ?? job.message,
        }),
      );
      break;
    case "cancelled":
      dispatch(appTasksSlice.actions.taskCancelled({ id: job.id }));
      break;
  }
  taskCancelRegistry.unregister(job.id);
};

/*
 * Turns a backend event into store updates. The data slice stays the UI's
 * source of truth for metadata; this is how changes the backend originates
 * (segmentation results now, remote edits later) reach it.
 */
const applyBackendEvent = (
  event: BackendEvent,
  backend: Backend,
  store: StoreHandle,
): void => {
  switch (event.type) {
    case "kinds/didAdd":
      store.dispatch(dataSlice.actions.batchAddKind(event.kinds));
      return;
    case "annotations/didAdd":
      store.dispatch(dataSlice.actions.batchAddAnnotationVolume(event.volumes));
      store.dispatch(dataSlice.actions.batchAddAnnotation(event.annotations));
      return;
    case "jobs/didUpdate":
      applyJobUpdate(event.job, backend, store);
      return;
  }
};

export const connectBackendToStore = (
  backend: Backend,
  store: StoreHandle,
): (() => void) =>
  backend.subscribe((event) => applyBackendEvent(event, backend, store));
