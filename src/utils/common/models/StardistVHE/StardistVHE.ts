import { History } from "@tensorflow/tfjs";

import { ModelTask } from "types/ModelType";
import { ImageType } from "types";
import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { loadStardist } from "./loadStardist";

export class StardistVHE extends Segmenter {
  constructor() {
    super({
      name: "StardistVHE",
      task: ModelTask.Segmentation,
      graph: true,
      pretrained: true,
      trainable: false,
    });
  }

  async loadModel() {
    await loadStardist();
  }

  loadTraining(images: ImageType[], preprocessingArgs: any): void {}

  loadValidation(images: ImageType[], preprocessingArgs: any): void {}

  loadInference(images: ImageType[], preprocessingArgs: any): void {}

  async train(options: any, callbacks: any): Promise<History> {
    return this._history!;
  }

  predict() {
    return [[]];
  }
  evaluate() {}
}
