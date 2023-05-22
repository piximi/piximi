import { History } from "@tensorflow/tfjs";

import { ModelTask } from "types/ModelType";
import { ImageType } from "types";
import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";

type LoadModelArgs = {
  simple: boolean;
};

// TODO - segmenter: change name to Fulyl Convolutional
export class FullyCOnnectedSegmenter extends Segmenter {
  constructor() {
    super({
      name: "Fully Convolutional Network",
      task: ModelTask.Segmentation,
      graph: true,
      pretrained: false,
      trainable: false,
    });
  }

  loadModel({ simple }: LoadModelArgs) {}

  loadTraining(images: ImageType[], preprocessingArgs: any): void {}
  loadValidation(images: ImageType[], preprocessingArgs: any): void {}
  loadInference(images: ImageType[], preprocessingArgs: any): void {}

  async train(options: any, callbacks: any): Promise<History> {
    return this._history!;
  }

  predict() {}
  evaluate() {}
}
