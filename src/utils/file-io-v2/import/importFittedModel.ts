import JSZip from "jszip";
import { z } from "zod";

import { getClassifierApi } from "utils/dl/classification";
import type { ModelInfoDTO, Run } from "utils/dl/classification/types";
import {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
} from "utils/dl/enums";
import { logger } from "utils/logUtils";

import {
  MODEL_JSON_FILENAME,
  MODEL_MANIFEST_FILENAME,
  MODEL_RUNS_FILENAME,
} from "../consts";

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

export const RunArraySchema = z.array(RunSchema);

const ManifestSchema = z.object({
  formatVersion: z.number(),
  savedAt: z.string(),
  files: ManifestFilesSchema,
  modelName: z.string(),
});

type PiximiManifest = z.infer<typeof ManifestSchema>;

export async function parseManifest(
  file: JSZip.JSZipObject,
): Promise<PiximiManifest | null> {
  try {
    const text = await file.async("text");
    const json = JSON.parse(text);
    const result = ManifestSchema.safeParse(json);
    if (result.success) return result.data;
    return null;
  } catch {
    return null;
  }
}
export async function parseRunHistory(
  buffer: ArrayBuffer,
): Promise<Run[] | null> {
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

export const importFittedModelFromZip = async (
  zipBuffer: ArrayBuffer,
): Promise<{ modelDetails: ModelInfoDTO; runs: Run[] }> => {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipBuffer);
  } catch (e) {
    throw new Error("Failed to parse zip", e as Error);
  }
  console.log(zip.files);
  let manifest: PiximiManifest | null = null;

  if (MODEL_MANIFEST_FILENAME in zip.files) {
    manifest = await parseManifest(zip.files[MODEL_MANIFEST_FILENAME]);
  }
  const cfApi = getClassifierApi();
  let model: {
    modelName: string;
    modelJson: File;
    modelWeights: File[];
    modelRuns?: ArrayBuffer;
  };
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

    model = {
      modelJson: new File([topologyBuffer], manifest.files.modelTopology, {
        type: "application/json",
      }),
      modelWeights: [
        new File([weightsBuffer], manifest.files.modelWeights, {
          type: "application.octet-stream",
        }),
      ],
      modelName: manifest.modelName,
    };
    if (runsFile) {
      model.modelRuns = await runsFile.async("arraybuffer");
    }
  } else {
    const modelFileRegEx = new RegExp(
      `.json$|.weights.bin|${MODEL_JSON_FILENAME}$`,
    );
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
          const _modelWeights = new File([fileBuffer], fileName, {
            type: "application.octet-stream",
          });
          modelWeights.push(_modelWeights);
          break;

        default:
      }
    }
    if (!modelJson || !modelWeights) {
      const missing = [
        !modelJson && "Model Topology",
        !modelWeights && "Model Weights",
      ]
        .filter(Boolean)
        .join(", ");
      throw new Error(
        `Archive is missing required file(s): ${missing}. The archive may have been modified.`,
      );
    }
    model = {
      modelJson,
      modelName: modelName!,
      modelWeights,
      modelRuns,
    };
  }

  const result = await cfApi.modelFromFiles({
    descFile: model.modelJson,
    weightsFiles: model.modelWeights,
    modelName: model.modelName, // authoritative source — filename is irrelevant
  });
  if (result.success) {
    let runs: Run[];
    if (model.modelRuns) runs = (await parseRunHistory(model.modelRuns)) ?? [];
    else runs = [];
    return { modelDetails: result.data, runs };
  } else {
    throw new Error(`${result.reason.code}:${result.reason.message}`, {
      cause: result.reason.cause,
    });
  }
};
