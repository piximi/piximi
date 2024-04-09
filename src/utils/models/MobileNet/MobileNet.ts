import { createMobileNet } from "./loadMobileNet";
import { createCompileArgs } from "../helpers";
import { SequentialClassifier } from "../AbstractClassifier/AbstractClassifier";
import { LoadModelArgs } from "../types";
import { ModelTask } from "../enums";

export class MobileNet extends SequentialClassifier {
  constructor() {
    super({
      name: "MobileNet",
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
  }

  public override dispose() {
    super.dispose();
  }
}
