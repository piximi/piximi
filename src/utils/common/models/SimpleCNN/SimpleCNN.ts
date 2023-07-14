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

export class SimpleCNN extends SequentialClassifier {
  constructor() {
    super({
      name: "SimpleCNN",
      task: ModelTask.Classification,
      graph: false,
      pretrained: false,
      trainable: true,
    });
  }

  public override dispose() {
    super.dispose();
  }

  public loadModel({
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
