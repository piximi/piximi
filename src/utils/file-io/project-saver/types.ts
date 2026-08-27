import type { ClassifierState } from "store/classifier/types";
import type { DataStateV2 } from "store/data/types";

import type { SerializedModels } from "utils/dl/types";
import type { Progress } from "utils/types";

/**
 * The slices a project file captures, as they exist in Redux at save time.
 *
 * The `project` slice is deliberately absent — see the format notes in
 * `version-writers/writeV2.ts`.
 */
export type SerializableProject = {
  data: DataStateV2;
  classifier: ClassifierState;
};

export type SaveProjectInput = {
  name: string;
  project: SerializableProject;
};

/**
 * What actually crosses into the save worker.
 *
 * `models` is absent from the public input because only the main thread can
 * produce it — the models live in the classifier worker's registry, and one
 * worker can't reach into another.
 */
export type SaveProjectWorkerInput = SaveProjectInput & {
  models: SerializedModels;
};

export type SaveProjectOutput = {
  blob: Blob;
};

export type SaveProjectResult =
  | { success: true; blob: Blob }
  | { success: false; cancelled: true }
  | { success: false; cancelled: false; error: Error };

/**
 * Reads channel pixel/histogram buffers back out of storage.
 *
 * Injected rather than called directly so `writeV2` stays testable without
 * IndexedDB, and so the worker can supply its own uncached connector.
 */
export type ChannelDataAccessor = (
  channelIds: string[],
) => Promise<Map<string, { data: ArrayBuffer; histogram: ArrayBuffer }>>;

/**
 * Public contract for the project saver.
 *
 * Serializes the current project into a `.zip` containing a `.zarr` tree plus
 * the TF.js files for every trained model, ready to hand to `saveAs`.
 */
export interface IProjectSaver {
  saveProject(input: SaveProjectInput): Promise<SaveProjectResult>;
  onProgress(callback: (progress: Progress) => void): () => void;
  getProgress(): Progress;
  cancel(): void;
}
