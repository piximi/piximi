import { History, LayersModel } from "@tensorflow/tfjs";
import { LossFunction } from "./LossFunction";
import { Metric } from "./Metric";
import { OptimizationAlgorithm } from "./OptimizationAlgorithm";
import { FitOptions } from "./FitOptions";
import { Shape } from "./Shape";
import { PreprocessOptions } from "./PreprocessOptions";
import { SegmenterModelProps } from "./ModelType";
import { SegmenterEvaluationResultType } from "./EvaluationResultType";

export type SegmenterStoreType = {
  fitting: boolean;
  evaluating: boolean;
  predicting: boolean;
  preprocessOptions: PreprocessOptions;
  fitOptions: FitOptions;
  inputShape: Shape;
  learningRate: number;
  lossFunction:
    | LossFunction
    | Array<LossFunction>
    | { [outputName: string]: LossFunction };
  metrics: Array<Metric>;
  optimizationAlgorithm: OptimizationAlgorithm;
  trainingPercentage: number;
  trainingHistory?: History;
  predicted: boolean;
  evaluationResult: SegmenterEvaluationResultType;
  compiled?: LayersModel;
  fitted?: LayersModel;
  selectedModel: SegmenterModelProps;
  userUploadedModel?: SegmenterModelProps;
};
