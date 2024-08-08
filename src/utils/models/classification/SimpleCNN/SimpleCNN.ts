import { createSimpleCNN } from "./loadSimpleCNN";
import { createCompileArgs } from "../../helpers";
import { SequentialClassifier } from "../AbstractClassifier/AbstractClassifier";

import { LoadModelArgs } from "../../types";
import { ModelTask } from "../../enums";

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
    if (this._model) return;
    this._model = createSimpleCNN(inputShape, numClasses, randomizeWeights!);
    const compileArgs = createCompileArgs(compileOptions);
    this._model.compile(compileArgs);
  }
}
