import JSZip from "jszip";

import {
  MANIFEST_VERSION,
  MODEL_JSON_FILENAME,
  MODEL_MANIFEST_FILENAME,
  MODEL_RUNS_FILENAME,
  MODEL_WEIGHTS_FILENAME,
} from "../consts";

import type { Run } from "core/dl/classification/types";

export const buildClassifierZip = async (
  modelData: { modelJson: Blob; modelWeights: Blob },
  runs: Run[],
  meta: { modelName: string },
): Promise<Blob> => {
  const runJson = JSON.stringify(runs);
  const runsBlob = new Blob([runJson], { type: "application/json" });

  const manifestBlob = new Blob(
    [
      JSON.stringify({
        formatVersion: MANIFEST_VERSION,
        savedAt: new Date().toISOString().toLocaleString(),
        modelName: meta.modelName,
        files: {
          modelTopology: MODEL_JSON_FILENAME,
          modelWeights: MODEL_WEIGHTS_FILENAME,
          runHistory: MODEL_RUNS_FILENAME,
        },
      }),
    ],
    { type: "application/json" },
  );
  const zip = new JSZip();
  zip.file(MODEL_MANIFEST_FILENAME, manifestBlob);
  zip.file(MODEL_JSON_FILENAME, modelData.modelJson);
  zip.file(MODEL_WEIGHTS_FILENAME, modelData.modelWeights);
  zip.file(MODEL_RUNS_FILENAME, runsBlob);
  const zipBlob = await zip.generateAsync({ type: "blob" });
  return zipBlob;
};

/** Zip entry names can't carry path separators or a leading dot. */
const sanitizeZipEntryName = (name: string) => name.replace(/[./\\]/g, "_");

/**
 * Bundle several fitted classifiers into one archive of per-model zips.
 *
 * Each inner `<modelName>.zip` is exactly what {@link buildClassifierZip}
 * produces, so after unzipping the outer archive every model imports through
 * the normal single-model import path, manifest and run history included.
 */
export const buildClassifiersBundle = async (
  entries: {
    modelName: string;
    modelData: { modelJson: Blob; modelWeights: Blob };
    runs: Run[];
  }[],
): Promise<Blob> => {
  const bundle = new JSZip();
  for (const { modelName, modelData, runs } of entries) {
    const modelZip = await buildClassifierZip(modelData, runs, { modelName });
    bundle.file(`${sanitizeZipEntryName(modelName)}.zip`, modelZip);
  }
  return bundle.generateAsync({ type: "blob" });
};
