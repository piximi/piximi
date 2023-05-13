import { ImageType, ModelArchitecture } from "types";
import { Model } from "../Model";
import { History } from "@tensorflow/tfjs";

export class Segmenter extends Model {
  _history?: History;
  readonly architecture: ModelArchitecture;

  constructor(
    architecture: ModelArchitecture,
    modelArgs: ConstructorParameters<typeof Model>[0]
  ) {
    super(modelArgs);
    this.architecture = architecture;
  }

  loadModel(): void {}
  loadTraining(images: ImageType[], preprocessingArgs: any): void {}
  loadValidation(images: ImageType[], preprocessingArgs: any): void {}
  loadInference(images: ImageType[], preprocessingArgs: any): void {}

  async train(options: any, callbacks: any): Promise<History> {
    return this._history!;
  }

  predict(options: any, callbacks: any): any {}

  dispose(): void {}

  get modelLoaded(): boolean {
    return false;
  }
  get trainingLoaded(): boolean {
    return false;
  }
  get validationLoaded(): boolean {
    return false;
  }
  get inferenceLoaded(): boolean {
    return false;
  }
}
