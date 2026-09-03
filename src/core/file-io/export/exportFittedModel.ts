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
