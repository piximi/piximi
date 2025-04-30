import { createSimpleCNN } from "./loadSimpleCNN";
import { createCompileArgs } from "../../helpers";
import { SequentialClassifier } from "../AbstractClassifier/AbstractClassifier";

import { LoadModelArgs } from "../../types";
import { ModelTask } from "../../enums";

export class SimpleCNN extends SequentialClassifier {
  constructor(name?: string) {
    super({
      name: name ?? "SimpleCNN",
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
    preprocessOptions,
  }: LoadModelArgs) {
    if (this._model) return;
    this._model = createSimpleCNN(inputShape, numClasses, randomizeWeights!);
    const compileArgs = createCompileArgs(compileOptions);
    this._model.compile(compileArgs);
    this._preprocessingOptions = {
      inputShape: inputShape,
      ...preprocessOptions.cropOptions,
      shuffle: preprocessOptions.shuffle,
      rescale: preprocessOptions.rescaleOptions.rescale,
      batchSize: compileOptions.batchSize,
    };
    this._optimizerSettings = compileOptions;
  }
}
