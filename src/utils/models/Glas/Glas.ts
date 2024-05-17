import { GraphModel, History, LayersModel } from "@tensorflow/tfjs";
import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { preprocessGlas } from "./preprocessGlas";
import { predictGlas } from "./predictGlas";
import { generateUUID } from "utils/common/helpers";
import { LoadInferenceDataArgs } from "../types";
import { ModelTask } from "../enums";
import { Kind, ImageObject } from "store/data/types";
import { loadGlas } from "./loadGlas";

export class Glas extends Segmenter {
  protected _fgKind?: Kind;
  protected _inferenceDataDims?: Array<{
    width: number;
    height: number;
  }>;
  constructor() {
    super({
      name: "GlandSegmentation",
      task: ModelTask.Segmentation,
      graph: true,
      pretrained: true,
      trainable: false,
      requiredChannels: 3,
    });
  }

  public async loadModel() {
    if (this._model) return;
    this._model = await loadGlas();
  }

  public loadTraining(images: ImageObject[], preprocessingArgs: any): void {}

  public loadValidation(images: ImageObject[], preprocessingArgs: any): void {}

  public loadInference(
    images: ImageObject[],
    preprocessingArgs: LoadInferenceDataArgs
  ): void {
    this._inferenceDataDims = images.map((im) => {
      const { height, width } = im.shape;
      return { height, width };
    });
    this._inferenceDataset = preprocessGlas(images, 1);

    if (preprocessingArgs.kinds) {
      if (preprocessingArgs.kinds.length !== 1)
        throw Error(
          `${this.name} Model only takes a single foreground category`
        );
      this._fgKind = preprocessingArgs.kinds[0];
    } else if (!this._fgKind) {
      const unknownCategoryId = generateUUID({ definesUnknown: true });
      this._fgKind = {
        id: "Glands",
        categories: [unknownCategoryId],
        containing: [],
        unknownCategoryId,
      };
    }
  }

  public async train(options: any, callbacks: any): Promise<History> {
    if (!this.trainable) {
      throw new Error(`Training not supported for Model ${this.name}`);
    } else {
      throw new Error(`Training not yet implemented for Model ${this.name}`);
    }
  }

  public async predict() {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    if (this._model instanceof LayersModel) {
      throw Error(`"${this.name}" Model must a Graph, not Layers`);
    }

    if (!this._inferenceDataset) {
      throw Error(`"${this.name}" Model's inference data not loaded`);
    }

    if (!this._fgKind) {
      throw Error(`"${this.name}" Model's foreground kind is not loaded`);
    }

    const graphModel = this._model as GraphModel;

    const infT = await this._inferenceDataset.toArray();
    // imTensor disposed in `predictGlas`

    const annotationsPromises = infT.map((imTensor, idx) => {
      return predictGlas(
        graphModel,
        imTensor,
        this._fgKind!.id,
        this._fgKind!.unknownCategoryId,
        this._inferenceDataDims![idx]
      );
    });
    const annotations = await Promise.all(annotationsPromises);

    return annotations;
  }

  public inferenceCategoriesById(catIds: Array<string>) {
    return [];
  }
  public inferenceKindsById(kinds: string[]) {
    if (!this._fgKind) {
      throw Error(`"${this.name}" Model has no foreground kind loaded`);
    }

    return kinds.includes(this._fgKind.id) ? [this._fgKind] : [];
  }

  public override dispose() {
    this._fgKind = undefined;
    super.dispose();
  }
}
