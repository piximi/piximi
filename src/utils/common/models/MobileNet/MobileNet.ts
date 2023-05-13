import { ModelTask } from "types/ModelType";
import { CompileOptions, Shape } from "types";
import { createMobileNet } from "./loadMobileNet";
import { createCompileArgs } from "../utils/compileArgs";
import { SequentialClassifier } from "../AbstractClassifier/AbstractClassifier";

type LoadModelArgs = {
  inputShape: Shape;
  numClasses: number;
  compileOptions: CompileOptions;
  freeze: boolean;
  useCustomTopLayer: boolean;
};

export class MobileNet extends SequentialClassifier<LoadModelArgs> {
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

  async loadModel({
    inputShape,
    numClasses,
    compileOptions,
    freeze = false,
    useCustomTopLayer = true,
  }: LoadModelArgs) {
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
}
