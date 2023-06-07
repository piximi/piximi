import { History } from "@tensorflow/tfjs";
import { FitOptions } from "./FitOptions";
import { Shape } from "./Shape";
import { PreprocessOptions } from "./PreprocessOptions";
import { SegmenterEvaluationResultType } from "./EvaluationResultType";
import { CompileOptions } from "./CompileOptions";
import { Segmenter } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";
import { ModelStatus } from "./ModelType";

export type SegmenterStoreType = {
  // pre-fit state
  selectedModel: Segmenter;
  inputShape: Shape;
  preprocessOptions: PreprocessOptions;
  fitOptions: FitOptions;

  compileOptions: CompileOptions;

  trainingPercentage: number;
  trainingHistory?: History;
  evaluationResult: SegmenterEvaluationResultType;

  modelStatus: ModelStatus;
};
