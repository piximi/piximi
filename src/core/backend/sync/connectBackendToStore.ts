import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { taskCancelRegistry } from "store/appTasks/taskCancelRegistry";
import { backendSyncSlice } from "store/backendSync";
import { dataSlice } from "store/data";

import { isTerminal } from "../jobs";

import type { ChannelMeta, ImageSeries } from "core/entities";

import type { AppTaskType } from "store/appTasks/types";

import type { BackendEvent } from "../events";
import type { Job, JobKind } from "../jobs";
import type { StoreHandle } from "../local/store";
import type { Backend, ImageRecord } from "../types";

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

/* Records carry their series; several of them may share one. */
const applyImagesAdded = (
  records: ImageRecord[],
  channelMetas: ChannelMeta[],
  store: StoreHandle,
) => {
  const series = new Map<string, ImageSeries>();
  for (const record of records) series.set(record.series.id, record.series);
  store.dispatch(
    dataSlice.actions.addImageSeries({
      imageSeries: [...series.values()],
      images: records.map((record) => record.image),
      planes: records.flatMap((record) => record.planes),
      channels: records.flatMap((record) => record.channels),
      channelMetas,
    }),
  );
};

/*
 * Turns a backend event into store updates. For the local backend the data
 * slice is the source of truth, so everything it announces is written there
 * and the data revision follows. A remote project is only mirrored in part
 * (its annotations are never mirrored; the grids page them from the
 * backend), so every event also moves the revision by hand, which is what
 * makes open windows and counts fetch again.
 */
const applyBackendEvent = (
  event: BackendEvent,
  backend: Backend,
  store: StoreHandle,
): void => {
  const remote = backend.kind === "remote";
  switch (event.type) {
    case "kinds/didAdd":
      store.dispatch(dataSlice.actions.batchAddKind(event.kinds));
      break;
    case "annotations/didAdd":
      if (!remote) {
        store.dispatch(
          dataSlice.actions.batchAddAnnotationVolume(event.volumes),
        );
        store.dispatch(dataSlice.actions.batchAddAnnotation(event.annotations));
      }
      break;
    case "jobs/didUpdate":
      applyJobUpdate(event.job, backend, store);
      return;
    case "images/didAdd":
      applyImagesAdded(event.records, event.channelMetas, store);
      break;
    case "models/didChange":
      // Nothing in the store holds models; the model dialog subscribes.
      return;
  }
  if (remote) store.dispatch(backendSyncSlice.actions.backendDataChanged());
};

export const connectBackendToStore = (
  backend: Backend,
  store: StoreHandle,
): (() => void) =>
  backend.subscribe((event) => applyBackendEvent(event, backend, store));
