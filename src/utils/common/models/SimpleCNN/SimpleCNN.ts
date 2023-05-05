import { createSimpleCNN } from "./loadSimpleCNN";
import { createCompileArgs } from "../utils/compileArgs";
import { SequentialClassifier } from "../AbstractClassifier/AbstractClassifier";

import { ModelTask } from "types/ModelType";
import { CompileOptions, Shape } from "types";

type LoadModelArgs = {
  inputShape: Shape;
  numClasses: number;
  compileOptions: CompileOptions;
  randomizeWeights: boolean;
};
export class SimpleCNN extends SequentialClassifier<LoadModelArgs> {
  constructor() {
    super({
      name: "SimpleCNN",
      task: ModelTask.Classification,
      graph: false,
      src: "",
      pretrained: false,
    });
  }

  loadModel({
    inputShape,
    numClasses,
    randomizeWeights,
    compileOptions,
  }: LoadModelArgs) {
    this._model = createSimpleCNN(inputShape, numClasses, randomizeWeights);
    const compileArgs = createCompileArgs(compileOptions);
    this._model.compile(compileArgs);
  }
}
