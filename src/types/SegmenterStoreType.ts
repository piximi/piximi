import { History, LayersModel, Tensor, data, Rank } from "@tensorflow/tfjs";
import { FitOptions } from "./FitOptions";
import { Shape } from "./Shape";
import { PreprocessOptions } from "./PreprocessOptions";
import { SegmenterModelProps } from "./ModelType";
import { SegmenterEvaluationResultType } from "./EvaluationResultType";
import { CompileOptions } from "./CompileOptions";

export type SegmenterStoreType = {
  fitting: boolean;
  evaluating: boolean;
  predicting: boolean;
  preprocessOptions: PreprocessOptions;
  compileOptions: CompileOptions;
  fitOptions: FitOptions;
  inputShape: Shape;
  trainingPercentage: number;
  trainingHistory?: History;
  predicted: boolean;
  evaluationResult: SegmenterEvaluationResultType;
  compiled?: LayersModel;
  fitted?: LayersModel;
  selectedModel: SegmenterModelProps;
  userUploadedModel?: SegmenterModelProps;
  trainDataSet?: data.Dataset<{
    xs: Tensor<Rank.R4>;
    ys: Tensor<Rank.R4>;
    id: Tensor<Rank.R1>;
  }>;
  valDataSet?: data.Dataset<{
    xs: Tensor<Rank.R4>;
    ys: Tensor<Rank.R4>;
    id: Tensor<Rank.R1>;
  }>;
};
