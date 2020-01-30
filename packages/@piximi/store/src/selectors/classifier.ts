import {ClassifierState, CompileOptions, FitOptions} from "@piximi/types";
import {LayersModel, Tensor} from "@tensorflow/tfjs";
import {Dataset} from "@tensorflow/tfjs-data";

export const compiledSelector = ({classifier}): LayersModel => {
  return classifier.compiled;
};

export const compileOptionsSelector = ({classifier}): CompileOptions => {
  return {
    learningRate: classifier.learningRate,
    lossFunction: classifier.lossFunction,
    metrics: classifier.metrics,
    optimizationFunction: classifier.optimizationFunction
  };
};

export const dataSelector = ({
  classifier
}): Dataset<{xs: Tensor; ys: Tensor}> => {
  return classifier.data;
};

export const fitOptionsSelector = ({classifier}): FitOptions => {
  return classifier.fitOptions;
};

export const fittedSelector = ({classifier}): LayersModel => {
  return classifier.fitted;
};

export const generatorOptionsSelector = ({
  classifier
}: {
  classifier: ClassifierState;
}): {validationPercentage: number} => {
  return {
    validationPercentage: classifier.validationPercentage
  };
};

export const openedSelector = ({classifier}): LayersModel => {
  return classifier.opened;
};

export const validationDataSelector = ({
  classifier
}): Dataset<{xs: Tensor; ys: Tensor}> => {
  return classifier.validationData;
};

export const validationPercentageSelector = ({classifier}): number => {
  return classifier.validationPercentage;
};
