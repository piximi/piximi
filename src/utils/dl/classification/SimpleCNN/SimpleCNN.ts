import { createSimpleCNN } from "./loadSimpleCNN";
import { createCompileArgs } from "../../utils";
import { SequentialClassifier } from "../AbstractClassifier/AbstractClassifier";
import { ModelTask } from "../../enums";

import type { LoadModelArgs } from "../../types";

export class SimpleCNN extends SequentialClassifier {
  private seed: number;
  constructor(name: string = "SimpleCNN", seed: number) {
    super({
      name: name,
      task: ModelTask.Classification,
      graph: false,
      pretrained: false,
      trainable: true,
    });
    this.seed = seed;
  }

  public override dispose() {
    super.dispose();
  }

  public loadModel({
    inputShape,
    numClasses,
    compileOptions,
    preprocessOptions,
  }: LoadModelArgs) {
    if (this._model) return;
    this._model = createSimpleCNN(inputShape, numClasses, this.seed);
    const compileArgs = createCompileArgs(compileOptions);
    this._model.compile(compileArgs);
    this._preprocessingOptions = {
      inputShape: inputShape,
      ...preprocessOptions.cropOptions,
      shuffle: preprocessOptions.shuffle,
      normalize: preprocessOptions.normalizeOptions.normalize,
      batchSize: compileOptions.batchSize,
    };
    this._optimizerSettings = compileOptions;
  }
}
