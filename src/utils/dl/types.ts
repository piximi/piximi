import type { Shape } from "store/data/types";
import type { BBox, ExtendedChannel } from "store/dataV2/types";

import type {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
  Partition,
} from "./enums";

export type TrainingInput = {
  id: string;
  partition: Partition;
  categoryId: string;
  channelsRef: ExtendedChannel[];
  shape: Shape;
  region: BBox;
};

export type InferenceInput = Omit<TrainingInput, "partition" | "categoryId">;

export type NormalizeOptions = {
  normalize: boolean;
  center: boolean;
};

export type CropOptions = {
  numCrops: number;
  cropSchema: CropSchema;
};

export type SegmenterPreprocessSettings = {
  shuffle: boolean;
  normalizeOptions: NormalizeOptions;
  cropOptions: CropOptions;
};

export type SegmenterCompileSettings = {
  learningRate: number;
  lossFunction:
    | LossFunction
    | Array<LossFunction>
    | { [outputName: string]: LossFunction };
  metrics: Array<Metric>;
  optimizationAlgorithm: OptimizationAlgorithm;
};

export type SegmenterEvaluationResultType = {
  pixelAccuracy: number;
  IoUScore: number;
  diceScore: number;
};

export type ExtractedModelFile = {
  modelJson?: File;
  modelWeights?: File;
};

export type ExtractedModelFileMap = Record<string, ExtractedModelFile>;

export type SerializedModelData = {
  modelJson: { blob: Blob; fileName: string };
  modelWeights: { blob: Blob; fileName: string };
};
export type SerializedModels = Record<string, SerializedModelData>;
