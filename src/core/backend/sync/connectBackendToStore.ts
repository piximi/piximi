import { projectReset } from "store/actions";
import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { taskCancelRegistry } from "store/appTasks/taskCancelRegistry";
import { backendSyncSlice } from "store/backendSync";
import { classifierSlice } from "store/classifier";
import { dataSlice } from "store/data";

import { clearCache } from "utils/renderedSrcsCache";

import { isTerminal } from "../jobs";
import { hydrateStoreFromBackend } from "./hydrateStoreFromBackend";

import type { ChannelMeta, ImageSeries } from "core/entities";

import type { AppTaskType } from "store/appTasks/types";

import type { BackendEvent } from "../events";
import type { Job, JobKind } from "../jobs";
import type { StoreHandle } from "../local/store";
import type { Backend, ImageRecord } from "../types";

const taskType: Record<JobKind, AppTaskType> = {
  segmentation: "image-segmentation",
  "model-load": "model-load",
  "classifier-fit": "image-classification",
  "classifier-predict": "image-classification",
  measurements: "measurement",
  ingest: "file-upload",
  "project-import": "project-load",
  "project-export": "project-download",
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
  updatedChannelMetas: ChannelMeta[],
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
  // Only the value limits follow: how a meta is displayed is this client's.
  if (updatedChannelMetas.length > 0) {
    store.dispatch(
      dataSlice.actions.batchUpdateChannelMeta(
        updatedChannelMetas.map((meta) => ({
          id: meta.id,
          changes: {
            minValue: meta.minValue,
            maxValue: meta.maxValue,
            rampMinLimit: meta.rampMinLimit,
            rampMaxLimit: meta.rampMaxLimit,
          },
        })),
      ),
    );
  }
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
    case "kinds/didChange":
      // Only renames travel this way; the per-kind UI state follows the
      // rename action, so each changed name is dispatched as one.
      if (remote) {
        const { kinds } = store.getState().data;
        for (const kind of event.kinds) {
          const known = kinds.entities[kind.id];
          if (known && known.name !== kind.name) {
            store.dispatch(
              dataSlice.actions.updateKindName({
                kindId: kind.id,
                name: kind.name,
              }),
            );
          }
        }
      }
      break;
    case "kinds/didRemove":
      // The reducer's cascade mirrors the backend's: volumes to the unknown
      // kind, the kind's categories dropped, per-kind UI state cleared.
      if (remote) {
        for (const id of event.kindIds) {
          store.dispatch(dataSlice.actions.deleteKind(id));
        }
      }
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
      applyImagesAdded(
        event.records,
        event.channelMetas,
        event.updatedChannelMetas ?? [],
        store,
      );
      break;
    case "models/didChange":
      // Nothing in the store holds models; the model dialog subscribes.
      return;
    case "images/didRemove":
      // The local store already changed; a remote mirror follows the event.
      if (remote) {
        store.dispatch(
          dataSlice.actions.batchDeleteImageObject(event.imageIds),
        );
      }
      break;
    case "annotations/didRemove":
      // Not mirrored for a remote project; the revision refreshes the grids.
      break;
    case "images/didUpdate":
      if (remote) {
        store.dispatch(dataSlice.actions.applyImageUpdates(event.updates));
      }
      break;
    case "images/didChange":
      if (remote) {
        store.dispatch(dataSlice.actions.updateImages(event.images));
      }
      break;
    case "annotations/didUpdate":
      // A remote project's annotations are mirrored only while a viewing
      // session holds them. The session's copy follows category and
      // partition changes (so a category deleted elsewhere does not leave
      // it naming a ghost) but never geometry or removals: a concurrent
      // edit of the same object surfaces as a conflict when the session
      // commits, rather than being merged into it unseen.
      if (remote) {
        store.dispatch(dataSlice.actions.applyVolumeUpdates(event.volumes));
        store.dispatch(
          dataSlice.actions.batchUpdateAnnotationPartition(event.annotations),
        );
      }
      break;
    case "categories/didChange":
      if (remote) {
        store.dispatch(dataSlice.actions.setCategories(event.categories));
      }
      break;
    case "project/didChange":
      if (remote) {
        store.dispatch(
          dataSlice.actions.updateExperimentName(event.experiment.name),
        );
      }
      break;
    case "project/didReset":
      // The local backend wrote the new project into the store itself; a
      // remote one is mirrored again from scratch.
      if (remote) {
        clearCache();
        store.dispatch(projectReset());
        void hydrateStoreFromBackend(backend, store.dispatch).catch(
          (error: unknown) => {
            console.error("Could not load the project again", error);
          },
        );
      }
      break;
    case "classifiers/didChange":
      // The local backend writes its own records; a remote one is mirrored.
      if (remote) {
        store.dispatch(
          classifierSlice.actions.setClassifiers(event.classifiers),
        );
      }
      return;
    case "classifiers/didEpoch":
      if (remote) {
        store.dispatch(
          classifierSlice.actions.appendEpoch({
            classifierId: event.classifierId,
            runId: event.runId,
            epoch: event.epoch,
          }),
        );
      }
      return;
  }
  if (remote) store.dispatch(backendSyncSlice.actions.backendDataChanged());
};

export const connectBackendToStore = (
  backend: Backend,
  store: StoreHandle,
): (() => void) =>
  backend.subscribe((event) => applyBackendEvent(event, backend, store));
