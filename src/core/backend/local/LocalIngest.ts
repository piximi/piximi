import { STORES } from "core/entities";
import { TaskCancelledError, isTaskCancelledError } from "core/dl/cancel";
import {
  inferMimeType,
  reconcileChannelMetas,
} from "core/file-io/file-loader/fileInputUtils";

import { selectAllChannelMetas, selectExperiment } from "store/data/selectors";
import { dataSlice } from "store/data";

import type { Channel, ImageSeries } from "core/entities";
import type { DataConnector } from "core/data-connector";
import type { ImageDecoder } from "core/file-io/file-loader/decoders";
import type { ReadStage } from "core/file-io/file-loader/types";

import type { EventBus } from "../events";
import type { JobRegistry } from "../jobs";
import type {
  BackendIngest,
  CallOptions,
  ImageRecord,
  IngestFailure,
  IngestSummary,
  UploadFile,
} from "../types";
import type { StoreHandle } from "./store";

type LocalIngestDeps = {
  store: StoreHandle;
  storage: DataConnector;
  decode: ImageDecoder;
  jobs: JobRegistry;
  bus: EventBus;
};

/* Where a file's decoding stands, as a share of its whole; storing the
 * channels takes the rest. */
const STAGE_SPAN: Record<ReadStage, [number, number]> = {
  extract: [0, 0.5],
  toDims: [0.5, 0.6],
  toExperiment: [0.6, 0.9],
};

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

/*
 * The in-browser ingest: each file is decoded in a worker, its channels are
 * written to IndexedDB, and its images are announced as `images/didAdd`,
 * which the sync layer writes into the data slice. Channel metas are
 * shared project-wide, one per channel index, so a file's metas are matched
 * onto the existing ones (by name, then index) and only widen their limits.
 */
export class LocalIngest implements BackendIngest {
  readonly #deps: LocalIngestDeps;

  constructor(deps: LocalIngestDeps) {
    this.#deps = deps;
  }

  async upload(
    files: UploadFile[],
    options?: CallOptions,
  ): Promise<IngestSummary> {
    const { jobs } = this.#deps;
    if (files.length === 0)
      return { imageIds: [], failed: [], cancelled: false };
    if (options?.signal?.aborted) {
      return { imageIds: [], failed: [], cancelled: true };
    }
    const job = jobs.start(
      "ingest",
      `Adding ${plural(files.length, "image file")}`,
      options?.signal,
    );
    const signal = jobs.signal(job.id);
    const imageIds: string[] = [];
    const failed: IngestFailure[] = [];
    let cancelled = false;
    for (let i = 0; i < files.length; i++) {
      if (signal.aborted) {
        cancelled = true;
        break;
      }
      const file = files[i];
      const report = (fraction: number) =>
        jobs.update(job.id, {
          progress: ((i + fraction) / files.length) * 100,
          message: `Adding ${file.name} (${i + 1}/${files.length})`,
        });
      report(0);
      try {
        imageIds.push(...(await this.#add(file, signal, report)));
      } catch (error) {
        if (signal.aborted || isTaskCancelledError(error)) {
          cancelled = true;
          break;
        }
        failed.push({
          name: file.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    const added = imageIds.length;
    if (cancelled) {
      jobs.finish(job.id, "cancelled", {
        message: `Stopped after ${plural(added, "image")}`,
      });
    } else if (failed.length > 0 && added === 0) {
      jobs.finish(job.id, "failed", {
        message: "No images added",
        error:
          failed.length === 1
            ? failed[0].error
            : `${failed.length} files could not be added: ${failed[0].error}`,
      });
    } else {
      jobs.finish(job.id, "succeeded", {
        message:
          `Added ${plural(added, "image")}` +
          (failed.length > 0
            ? `; ${plural(failed.length, "file")} failed`
            : ""),
      });
    }
    return { jobId: job.id, imageIds, failed, cancelled };
  }

  /* Decodes, stores and announces one file; resolves with its image ids. */
  async #add(
    file: UploadFile,
    signal: AbortSignal,
    report: (fraction: number) => void,
  ): Promise<string[]> {
    const { store, storage, decode, bus } = this.#deps;
    const experiment = selectExperiment(store.getState());
    const fileData =
      file.data instanceof ArrayBuffer
        ? file.data
        : await file.data.arrayBuffer();
    const output = await decode(
      {
        fileData,
        fileName: file.name,
        mimeType: inferMimeType(file.name, file.mimeType),
        dimConfig: file.dimensionConfig,
      },
      signal,
      ({ value, stage }) => {
        const [start, end] = STAGE_SPAN[stage];
        report(start + (end - start) * value);
      },
      experiment.channels,
    );
    if (signal.aborted) throw new TaskCancelledError();
    if (output.images.length === 0) throw new Error("The file holds no image");

    const stored = await storage.storeBatch(
      output.channels.map((channel) => ({
        id: channel.id,
        storeName: STORES.CHANNEL_DATA,
        data: channel,
      })),
    );
    if (!stored.success) throw stored.error;
    const refs = new Map(stored.data.map((ref) => [ref.storageId, ref]));
    const channels: Channel[] = output.channels.map(
      ({ data: _data, histogram: _histogram, ...channel }) => ({
        ...channel,
        storageReference: refs.get(channel.id)!,
      }),
    );
    report(0.95);

    const channelCount = output.images[0].shape.channels;
    const existing = selectAllChannelMetas(store.getState());
    const {
      metasToAdd,
      metaUpdates,
      channels: reconciled,
    } = reconcileChannelMetas(
      existing,
      output.channelMetas,
      channels,
      channelCount,
    );
    if (experiment.channels === undefined) {
      store.dispatch(dataSlice.actions.setExperimentChannels(channelCount));
    }
    const byId = new Map(existing.map((meta) => [meta.id, meta]));
    const updatedChannelMetas = metaUpdates.map(({ id, changes }) => ({
      ...byId.get(id)!,
      ...changes,
    }));
    const series = output.imageSeries.map(
      (item): ImageSeries => ({ ...item, experimentId: experiment.id }),
    );
    const records: ImageRecord[] = output.images.map((image) => {
      const planes = output.planes.filter(
        (plane) => plane.imageId === image.id,
      );
      const planeIds = new Set(planes.map((plane) => plane.id));
      return {
        image,
        series: series.find((item) => item.id === image.seriesId)!,
        planes,
        channels: reconciled.filter((channel) => planeIds.has(channel.planeId)),
      };
    });
    bus.emit({
      type: "images/didAdd",
      records,
      channelMetas: metasToAdd,
      updatedChannelMetas,
    });
    report(1);
    return output.images.map((image) => image.id);
  }
}
