import { History } from "@tensorflow/tfjs";

import { ModelTask } from "types/ModelType";
import { Category, ImageType } from "types";
import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";

type LoadModelArgs = {
  simple: boolean;
};

// TODO - segmenter: change name to Fulyl Convolutional
export class FullyConnectedSegmenter extends Segmenter {
  constructor() {
    super({
      name: "Fully Convolutional Network",
      task: ModelTask.Segmentation,
      graph: false,
      pretrained: false,
      trainable: true,
    });
  }

  loadModel({ simple }: LoadModelArgs) {}

  loadTraining(images: ImageType[], preprocessingArgs: any): void {}
  loadValidation(images: ImageType[], preprocessingArgs: any): void {}
  loadInference(images: ImageType[], preprocessingArgs: any): void {}

  async train(options: any, callbacks: any): Promise<History> {
    return this._history!;
  }

  predict() {
    return [[]];
  }

  inferenceCategoriesById(catIds: string[]): Category[] {
    return [];
  }

  evaluate() {}
}
