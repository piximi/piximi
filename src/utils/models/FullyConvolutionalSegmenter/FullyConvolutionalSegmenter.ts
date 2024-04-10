import { History } from "@tensorflow/tfjs";

import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { ModelTask } from "../enums";
import { OldCategory, OldImageType, Kind } from "store/data/types";

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

  public loadModel({ simple }: LoadModelArgs) {}

  public loadTraining(images: OldImageType[], preprocessingArgs: any): void {}
  public loadValidation(images: OldImageType[], preprocessingArgs: any): void {}
  public loadInference(images: OldImageType[], preprocessingArgs: any): void {}

  public async train(options: any, callbacks: any): Promise<History> {
    if (!this.trainable) {
      throw new Error(`Training not supported for Model ${this.name}`);
    } else {
      throw new Error(`Training not yet implemented for Model ${this.name}`);
    }
  }

  public predict() {
    return [];
  }

  public inferenceCategoriesById(catIds: string[]): OldCategory[] {
    return [];
  }
  public inferenceKindsById(kinds: string[]): Kind[] {
    return [];
  }

  public evaluate() {}

  public override dispose() {
    super.dispose();
  }
}
