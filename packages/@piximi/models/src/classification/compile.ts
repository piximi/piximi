import {CompileOptions} from "@piximi/types";
import {LayersModel} from "@tensorflow/tfjs";

export const compile = (opened: LayersModel, options: CompileOptions) => {
  const compiled = opened;

  const args = {
    optimizer: options.optimizationFunction,
    metrics: options.metrics,
    loss: options.lossFunction
  };

  compiled.compile(args);

  return compiled;
};
