import {
  LossFunction,
  Metric,
  ModelStatus,
  OptimizationAlgorithm,
} from "utils/models/enums";
import {
  ClassifierEvaluationResultType,
  CropOptions,
  FitOptions,
  RescaleOptions,
} from "utils/models/types";

export type PreprocessOptionsV01_02 = {
  shuffle: boolean;
  rescaleOptions: RescaleOptions;
  cropOptions: CropOptions;
};

export type ClassifierStateV01_02 = {
  // pre-fit state
  selectedModelIdx: number;
  inputShape: {
    planes: number;
    height: number;
    width: number;
    channels: number;
  };
  preprocessOptions: PreprocessOptionsV01_02;
  fitOptions: FitOptions;

  learningRate: number;
  lossFunction: LossFunction;
  optimizationAlgorithm: OptimizationAlgorithm;
  metrics: Array<Metric>;

  trainingPercentage: number;
  // post-evaluation results
  evaluationResult: ClassifierEvaluationResultType;
  // status flags
  modelStatus: ModelStatus;
  showClearPredictionsWarning: boolean;
};
