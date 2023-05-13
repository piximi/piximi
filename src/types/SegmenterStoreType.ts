import {
  History,
  LayersModel,
  Tensor,
  data,
  Rank,
  GraphModel,
} from "@tensorflow/tfjs";
import { FitOptions } from "./FitOptions";
import { Shape } from "./Shape";
import { PreprocessOptions } from "./PreprocessOptions";
import { SegmenterEvaluationResultType } from "./EvaluationResultType";
import { CompileOptions } from "./CompileOptions";
import { Segmenter } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";

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
  compiled?: LayersModel | GraphModel;
  fitted?: LayersModel | GraphModel;
  selectedModel: Segmenter;
  userUploadedModel?: Segmenter;
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
