import { createMobileNet } from "./loadMobileNet";
import { SequentialClassifier } from "../AbstractClassifier/AbstractClassifier";
import { ModelTask } from "../../../enums";
import { createCompileArgs } from "../../utils";

import type { LoadModelArgs } from "../../types";

export class MobileNet extends SequentialClassifier {
  constructor(name?: string) {
    super({
      name: name ?? "MobileNet",
      task: ModelTask.Classification,
      graph: false,
      pretrained: false,
      trainable: true,
      src: "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json",
    });
  }

  public async loadModel({
    inputShape,
    numClasses,
    compileOptions,
    freeze = false,
    useCustomTopLayer = true,
    preprocessOptions,
  }: LoadModelArgs) {
    if (this._model) return;

    this._model = await createMobileNet({
      inputShape,
      numClasses,
      resource: this.src!,
      freeze,
      useCustomTopLayer,
      defaultInputShape: [224, 224, 3],
      lastLayerName: "conv_pw_13_relu",
    });
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

  public override dispose() {
    super.dispose();
  }
}
