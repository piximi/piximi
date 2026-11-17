import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it, vi } from "vitest";

import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { taskCancelRegistry } from "store/appTasks/taskCancelRegistry";
import { dataSlice } from "store/data";

import { EventBus } from "../events";
import { connectBackendToStore } from "./connectBackendToStore";

import type { Backend } from "../types";
import type { StoreHandle } from "../local/store";
import type { Job } from "../jobs";

const job = (overrides: Partial<Job> = {}): Job => ({
  id: "job-1",
  kind: "segmentation",
  status: "running",
  progress: -1,
  message: "Starting",
  cancellable: true,
  startedAt: 1,
  ...overrides,
});

const setup = () => {
  const bus = new EventBus();
  const cancel = vi.fn(async () => {});
  const backend = {
    subscribe: bus.subscribe.bind(bus),
    jobs: { cancel, list: async () => [] },
  } as unknown as Backend;
  const store = configureStore({
    reducer: { data: dataSlice.reducer, appTasks: appTasksSlice.reducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
  });
  connectBackendToStore(backend, store as unknown as StoreHandle);
  const tasks = () => store.getState().appTasks.tasks;
  return { bus, cancel, tasks };
};

describe("connectBackendToStore: jobs", () => {
  it("registers a task when a job starts and keeps it updated", () => {
    const { bus, tasks } = setup();
    bus.emit({ type: "jobs/didUpdate", job: job() });
    expect(tasks()["job-1"]).toMatchObject({
      type: "image-segmentation",
      status: "running",
      progress: -1,
      label: "Starting",
      cancellable: true,
    });

    bus.emit({
      type: "jobs/didUpdate",
      job: job({ progress: 40, message: "Segmenting 2/5" }),
    });
    expect(tasks()["job-1"]).toMatchObject({
      progress: 40,
      label: "Segmenting 2/5",
    });

    bus.emit({
      type: "jobs/didUpdate",
      job: job({
        status: "succeeded",
        progress: 100,
        message: "Done: 3 added",
      }),
    });
    expect(tasks()["job-1"]).toMatchObject({
      status: "success",
      label: "Done: 3 added",
    });
    expect(taskCancelRegistry.has("job-1")).toBe(false);
  });

  it("routes the toast's cancel to backend.jobs.cancel while a job runs", () => {
    const { bus, cancel } = setup();
    bus.emit({ type: "jobs/didUpdate", job: job({ id: "job-2" }) });
    expect(taskCancelRegistry.has("job-2")).toBe(true);

    taskCancelRegistry.cancel("job-2");
    expect(cancel).toHaveBeenCalledWith("job-2");

    bus.emit({
      type: "jobs/didUpdate",
      job: job({ id: "job-2", status: "stopping", message: "Stopping..." }),
    });
    bus.emit({
      type: "jobs/didUpdate",
      job: job({ id: "job-2", status: "cancelled" }),
    });
    expect(taskCancelRegistry.has("job-2")).toBe(false);
  });

  it("marks a failed job's task with its error", () => {
    const { bus, tasks } = setup();
    bus.emit({
      type: "jobs/didUpdate",
      job: job({ id: "job-3", kind: "model-load" }),
    });
    bus.emit({
      type: "jobs/didUpdate",
      job: job({
        id: "job-3",
        kind: "model-load",
        status: "failed",
        error: "no adapter",
      }),
    });
    expect(tasks()["job-3"]).toMatchObject({
      type: "model-load",
      status: "error",
      error: "no adapter",
    });
  });

  it("ignores a job that was already over when first seen", () => {
    const { bus, tasks } = setup();
    bus.emit({
      type: "jobs/didUpdate",
      job: job({ id: "old", status: "succeeded" }),
    });
    expect(tasks()["old"]).toBeUndefined();
  });
});

describe("connectBackendToStore: images", () => {
  it("adds the images, their series once, and only new channel metas", () => {
    const bus = new EventBus();
    const store = configureStore({
      reducer: { data: dataSlice.reducer, appTasks: appTasksSlice.reducer },
      middleware: (getDefault) => getDefault({ serializableCheck: false }),
    });
    const backend = {
      subscribe: bus.subscribe.bind(bus),
      jobs: { cancel: async () => {}, list: async () => [] },
    } as unknown as Backend;
    connectBackendToStore(backend, store as unknown as StoreHandle);

    const series = { id: "s1", name: "s", imageIds: ["i1", "i2"] };
    const record = (id: string) => ({
      image: { id, name: id, seriesId: "s1", activePlaneId: `${id}-p` },
      series,
      planes: [{ id: `${id}-p`, imageId: id, channelIds: [`${id}-c`] }],
      channels: [{ id: `${id}-c`, planeId: `${id}-p`, channelMetaId: "m0" }],
    });
    bus.emit({
      type: "images/didAdd",
      records: [record("i1"), record("i2")] as never,
      channelMetas: [{ id: "m0", name: "ch0" }] as never,
    });

    const { data } = store.getState();
    expect(data.images.ids).toEqual(["i1", "i2"]);
    expect(data.imageSeries.ids).toEqual(["s1"]);
    expect(data.planes.ids).toEqual(["i1-p", "i2-p"]);
    expect(data.channels.ids).toEqual(["i1-c", "i2-c"]);
    expect(data.channelMetas.ids).toEqual(["m0"]);
  });
});
