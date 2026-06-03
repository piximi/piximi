import { createSimpleCNN } from "./loadSimpleCNN";
import { SequentialClassifier } from "../AbstractClassifier/AbstractClassifier";
import { ModelTask } from "../../../enums";
import { createCompileArgs } from "../../utils";
import { ModelArch, type LoadModelArgs } from "../../types";

export class SimpleCNN extends SequentialClassifier {
  private seed: number;
  constructor(name: string = "SimpleCNN", seed: number) {
    super({
      name: name,
      task: ModelTask.Classification,
      graph: false,
      pretrained: false,
      trainable: true,
      modelArch: ModelArch.SIMPLE_CNN,
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
    this._preprocessingSettings = {
      inputShape: inputShape,
      ...preprocessOptions.cropOptions,
      shuffle: preprocessOptions.shuffle,
      normalize: preprocessOptions.normalizeOptions.normalize,
      batchSize: compileOptions.batchSize,
    };
    this._optimizerSettings = compileOptions;
  }
}
