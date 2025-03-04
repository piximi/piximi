import {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
} from "utils/models/enums";
import { ClassifierStateV01_02 } from "./types";

export const MIMETYPES = [
  "image/png",
  "image/jpeg",
  "image/tiff",
  "image/tif",
  "application/tiff",
  "application/tif",
  "image/dicom",
  "image/bmp",
  "application/dicom",
] as const;

export const initialClassifierStateV01_02: ClassifierStateV01_02 = {
  modelStatus: 0,
  inputShape: {
    planes: 1,
    height: 64,
    width: 64,
    channels: 3,
  },
  fitOptions: {
    epochs: 10,
    batchSize: 32,
  },
  learningRate: 0.01,
  lossFunction: LossFunction.CategoricalCrossEntropy,
  selectedModelIdx: 0,
  metrics: [Metric.CategoricalAccuracy],
  optimizationAlgorithm: OptimizationAlgorithm.Adam,
  preprocessOptions: {
    shuffle: true,
    rescaleOptions: {
      rescale: true,
      center: false,
    },
    cropOptions: {
      numCrops: 1,
      cropSchema: CropSchema.None,
    },
  },
  trainingPercentage: 0.75,
  evaluationResult: {
    confusionMatrix: [],
    accuracy: -1,
    crossEntropy: -1,
    precision: -1,
    recall: -1,
    f1Score: -1,
  },
  showClearPredictionsWarning: true,
};
