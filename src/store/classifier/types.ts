import {
  ClassifierEvaluationResultType,
  OptimizerSettings,
  PreprocessSettings,
} from "utils/dl/types";

export type ModelClassMap = Record<number, string>;
export type ModelInfo = {
  trainingSet?: string[];
  validationDet?: string[];
  classMap?: ModelClassMap;
  preprocessSettings: PreprocessSettings;
  optimizerSettings: OptimizerSettings;
  evalResults: ClassifierEvaluationResultType[];
};
export type KindClassifier = {
  modelNameOrArch: string | number;
  modelInfoDict: Record<string, ModelInfo>;
};

export type KindClassifierDict = Record<string, KindClassifier>;
export type ClassifierState = {
  kindClassifiers: KindClassifierDict;
  showClearPredictionsWarning: boolean;
};
