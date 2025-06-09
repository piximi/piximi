import { History } from "@tensorflow/tfjs";

import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { ModelTask } from "../../enums";
import { Category, ImageObject, Kind } from "store/data/types";

type LoadModelArgs = {
  simple: boolean;
};

export class FullyConvolutionalSegmenter extends Segmenter {
  constructor() {
    super({
      name: "Fully Convolutional Network",
      task: ModelTask.Segmentation,
      graph: false,
      pretrained: false,
      trainable: true,
    });
  }

  public loadModel({ simple: _simple }: LoadModelArgs) {}

  public loadTraining(_images: ImageObject[], _preprocessingArgs: any): void {}
  public loadValidation(
    _images: ImageObject[],
    _preprocessingArgs: any,
  ): void {}
  public loadInference(_images: ImageObject[], _preprocessingArgs: any): void {}

  public async train(_options: any, _callbacks: any): Promise<History> {
    if (!this.trainable) {
      throw new Error(`Training not supported for Model ${this.name}`);
    } else {
      throw new Error(`Training not yet implemented for Model ${this.name}`);
    }
  }

  public predict() {
    return [];
  }

  public inferenceCategoriesById(_catIds: string[]): Category[] {
    return [];
  }
  public inferenceKindsById(_kinds: string[]): Kind[] {
    return [];
  }

  public evaluate() {}

  public override dispose() {
    super.dispose();
  }
}
