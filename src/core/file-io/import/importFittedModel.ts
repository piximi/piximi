import JSZip from "jszip";
import { z } from "zod";

import { getClassifierApi } from "core/dl/classification";
import {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
} from "core/dl/enums";

import { logger } from "utils/logUtils";

import { MODEL_MANIFEST_FILENAME, MODEL_RUNS_FILENAME } from "../consts";

import type { ModelInfoDTO, Run } from "core/dl/classification/types";

const RunHistoryEpochSchema = z.object({
  epoch: z.number(),
  loss: z.number(),
  valLoss: z.number(),
  accuracy: z.number(),
  valAccuracy: z.number(),
});

const NormalizeOptionsSchema = z.object({
  normalize: z.boolean(),
  center: z.boolean(),
});

const CropOptionsSchema = z.object({
  numCrops: z.number(),
  cropSchema: z.nativeEnum(CropSchema),
});

const ShapeSchema = z.object({
  planes: z.number(),
  height: z.number(),
  width: z.number(),
  channels: z.number(),
});

const LossFunctionSchema = z.nativeEnum(LossFunction);

const OptimizerSettingsSchema = z.object({
  learningRate: z.number(),
  lossFunction: z.union([
    LossFunctionSchema,
    z.array(LossFunctionSchema),
    z.record(z.string(), LossFunctionSchema),
  ]),
  metrics: z.array(z.nativeEnum(Metric)),
  optimizationAlgorithm: z.nativeEnum(OptimizationAlgorithm),
  epochs: z.number(),
  batchSize: z.number(),
});

const PreprocessSettingsSchema = z.object({
  shuffle: z.boolean(),
  inputShape: ShapeSchema,
  normalizeOptions: NormalizeOptionsSchema,
  cropOptions: CropOptionsSchema,
  trainingPercentage: z.number(),
});

const RunHyperparameterSnapshotSchema = z.object({
  architecture: z.union([z.literal(0), z.literal(1), z.string()]),
  optimizer: OptimizerSettingsSchema,
  preprocess: PreprocessSettingsSchema,
});

const EvaluationResultSchema = z.object({
  confusionMatrix: z.array(z.array(z.number())),
  accuracy: z.number(),
  crossEntropy: z.number(),
  precision: z.number(),
  recall: z.number().nullable(),
  f1Score: z.number().nullable(),
});

const RunSchema = z.object({
  id: z.string(),
  startedAt: z.string(),
  status: z.union([
    z.literal("in-progress"),
    z.literal("completed"),
    z.literal("stopped"),
    z.literal("failed"),
  ]),
  trigger: z.union([
    z.literal("fresh"),
    z.literal("continue"),
    z.literal("hitl-correction"),
    z.literal("import"),
  ]),
  appVersion: z.string(),
  tfjsVersion: z.string(),
  backend: z.string().optional(),
  hyperparameters: RunHyperparameterSnapshotSchema,
  // JSON keys are always strings; Record<number,string> and Record<string,string>
  // are equivalent at runtime for plain objects
  classMap: z.record(z.string(), z.string()),
  trainingFingerprint: z.string(),
  validationFingerprint: z.string(),
  valIds: z.array(z.string()),
  categorySetHash: z.string(),
  history: z.array(RunHistoryEpochSchema),
  parentRunId: z.string().optional(),
  finishedAt: z.string().optional(),
  seed: z.number().optional(),
  evalResults: EvaluationResultSchema.optional(),
  weightsRef: z.string().optional(),
});

const ManifestFilesSchema = z.object({
  modelTopology: z.string(),
  modelWeights: z.string(),
  runHistory: z.string().optional(),
});

const RunArraySchema = z.array(RunSchema);

const ManifestSchema = z.object({
  formatVersion: z.number(),
  savedAt: z.string(),
  files: ManifestFilesSchema,
  modelName: z.string(),
});

type PiximiManifest = z.infer<typeof ManifestSchema>;

async function parseManifestFromText(
  text: string,
): Promise<PiximiManifest | null> {
  try {
    const result = ManifestSchema.safeParse(JSON.parse(text));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

async function parseManifest(
  file: JSZip.JSZipObject,
): Promise<PiximiManifest | null> {
  try {
    return parseManifestFromText(await file.async("text"));
  } catch {
    return null;
  }
}

async function parseManifestFromFile(
  file: File,
): Promise<PiximiManifest | null> {
  try {
    return parseManifestFromText(await file.text());
  } catch {
    return null;
  }
}
async function parseRunHistory(buffer: ArrayBuffer): Promise<Run[] | null> {
  try {
    const text = new TextDecoder().decode(buffer);
    const json = JSON.parse(text);
    const result = RunArraySchema.safeParse(json);
    if (result.success) return result.data as Run[];
    else {
      console.error(result);
    }
    return null;
  } catch {
    return null;
  }
}

type ModelParts = {
  modelName: string;
  modelJson: File;
  modelWeights: File[];
  modelRuns?: ArrayBuffer;
};

async function loadModelFromParts(
  parts: ModelParts,
): Promise<{ modelDetails: ModelInfoDTO; runs: Run[] }> {
  const cfApi = getClassifierApi();
  const result = await cfApi.modelFromFiles({
    descFile: parts.modelJson,
    weightsFiles: parts.modelWeights,
    modelName: parts.modelName,
  });
  if (result.success) {
    const runs = parts.modelRuns
      ? ((await parseRunHistory(parts.modelRuns)) ?? [])
      : [];
    return { modelDetails: result.data, runs };
  } else {
    throw new Error(`${result.reason.code}:${result.reason.message}`, {
      cause: result.reason.cause,
    });
  }
}

export const importFittedModelFromZip = async (
  zipBuffer: ArrayBuffer,
): Promise<{ modelDetails: ModelInfoDTO; runs: Run[] }> => {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipBuffer);
  } catch (e) {
    throw new Error("Failed to parse zip", { cause: e });
  }

  let manifest: PiximiManifest | null = null;
  if (MODEL_MANIFEST_FILENAME in zip.files) {
    manifest = await parseManifest(zip.files[MODEL_MANIFEST_FILENAME]);
  }

  let parts: ModelParts;
  if (manifest) {
    const topologyFile = zip.file(manifest.files.modelTopology);
    const weightsFile = zip.file(manifest.files.modelWeights);
    const runsFile = manifest.files.runHistory
      ? zip.file(manifest.files.runHistory!)
      : undefined;

    if (!topologyFile || !weightsFile) {
      const missing = [
        !topologyFile && manifest.files.modelTopology,
        !weightsFile && manifest.files.modelWeights,
      ]
        .filter(Boolean)
        .join(", ");
      throw new Error(
        `Archive is missing required file(s): ${missing}. The archive may have been modified.`,
      );
    }

    const [topologyBuffer, weightsBuffer] = await Promise.all([
      topologyFile.async("arraybuffer"),
      weightsFile.async("arraybuffer"),
    ]);

    parts = {
      modelJson: new File([topologyBuffer], manifest.files.modelTopology, {
        type: "application/json",
      }),
      modelWeights: [
        new File([weightsBuffer], manifest.files.modelWeights, {
          type: "application/octet-stream",
        }),
      ],
      modelName: manifest.modelName,
      modelRuns: runsFile ? await runsFile.async("arraybuffer") : undefined,
    };
  } else {
    const modelFileRegEx = new RegExp(`\\.json$|\\.weights\\.bin$`);
    let modelJson: File | undefined = undefined;
    const modelWeights: File[] = [];
    let modelRuns: ArrayBuffer | undefined = undefined;
    let modelName: string | undefined = undefined;

    for await (const [fileName, file] of Object.entries(zip.files)) {
      if (!modelFileRegEx.test(fileName)) continue;

      const parsedFileName = fileName.split(".");
      if (!modelName) modelName = parsedFileName[0];
      const extension = parsedFileName.at(-1);
      const fileBuffer = await file.async("arraybuffer");

      switch (extension) {
        case "json":
          if (fileName === MODEL_RUNS_FILENAME) {
            modelRuns = fileBuffer;
          } else {
            if (modelJson) {
              logger(`Duplicate '.${extension}' file for ${modelName}`, {
                level: "warn",
              });
            }
            modelJson = new File([fileBuffer], fileName, {
              type: "application/json",
            });
          }
          break;
        case "bin":
          modelWeights.push(
            new File([fileBuffer], fileName, {
              type: "application/octet-stream",
            }),
          );
          break;
      }
    }

    if (!modelJson || modelWeights.length === 0) {
      const missing = [
        !modelJson && "Model Topology",
        modelWeights.length === 0 && "Model Weights",
      ]
        .filter(Boolean)
        .join(", ");
      throw new Error(
        `Archive is missing required file(s): ${missing}. The archive may have been modified.`,
      );
    }

    parts = { modelJson, modelName: modelName!, modelWeights, modelRuns };
  }

  return loadModelFromParts(parts);
};

export const importFittedModelFromFiles = async (input: {
  modelJson: File;
  modelWeights: File[];
  modelRuns?: File;
  manifest?: File;
}): Promise<{ modelDetails: ModelInfoDTO; runs: Run[] }> => {
  const parsedManifest = input.manifest
    ? await parseManifestFromFile(input.manifest)
    : null;
  const modelName =
    parsedManifest?.modelName ?? input.modelJson.name.replace(/\..+$/, "");
  const modelRuns = input.modelRuns
    ? await input.modelRuns.arrayBuffer()
    : undefined;
  return loadModelFromParts({
    modelName,
    modelJson: input.modelJson,
    modelWeights: input.modelWeights,
    modelRuns,
  });
};
