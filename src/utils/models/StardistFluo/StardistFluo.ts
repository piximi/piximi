import { GraphModel, History, LayersModel } from "@tensorflow/tfjs";

import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { loadStardist } from "./loadStardist";
import { preprocessStardist } from "./preprocessStardist";
import { predictStardist } from "./predictStardist";
import { generateUUID } from "utils/common/helpers";
import { LoadInferenceDataArgs } from "../types";
import { ModelTask } from "../enums";
import { Kind, ImageObject } from "store/data/types";

/*
 * Stardist (Versatile) Fluorescence Nuclei Segmentation
 * https://zenodo.org/records/6348085
 * https://bioimage.io/#/?tags=stardist&id=10.5281%2Fzenodo.6348084
 * https://github.com/stardist/stardist/blob/master/README.md#pretrained-models-for-2d
 * Stardist: model for object detection / instance segmentation with star-convex shapes
 * This pretrained model: meant to segment individual cell nuclei from single channel fluorescence data (2018 DSB)
 */
export class StardistFluo extends Segmenter {
  protected _fgKind?: Kind;
  protected _inferenceDataDims?: Array<{
    width: number;
    height: number;
    padX: number;
    padY: number;
  }>;

  constructor() {
    super({
      name: "StardistFluo",
      task: ModelTask.Segmentation,
      graph: true,
      pretrained: true,
      trainable: false,
      requiredChannels: 3,
    });
  }

  public async loadModel() {
    if (this._model) return;
    // inputs: [ {name: 'input', shape: [-1,-1,-1,1], dtype: 'float32'} ]
    // outputs: [ {name: 'concatenate_4/concat', shape: [-1, -1, -1, 33], dtype: 'float32'} ]
    // where each -1 matches on input and output of corresponding dim/axis
    // 33 -> 1 probability score, followed by 32 radial equiangular distances of rays
    this._model = await loadStardist();
  }

  public loadTraining(images: ImageObject[], preprocessingArgs: any): void {}

  public loadValidation(images: ImageObject[], preprocessingArgs: any): void {}

  // This Stardist model requires image dimensions to be a multiple of 16
  // (for VHE in particular), see:
  // https://github.com/stardist/stardist/blob/468c60552c8c93403969078e51bddc9c2c702035/stardist/models/model2d.py#L543
  // https://github.com/stardist/stardist/blob/master/stardist/models/model2d.py#L201C30-L201C30
  // and config here (under source -> grid): https://bioimage.io/#/?tags=stardist&id=10.5281%2Fzenodo.6348084&type=model
  // basically, in the case of VHE: 2^3 * 2 = 16
  protected _getPaddings(height: number, width: number) {
    const padY = height % 16 === 0 ? 0 : 16 - (height % 16);
    const padX = width % 16 === 0 ? 0 : 16 - (width % 16);

    return { padY, padX };
  }

  public loadInference(
    images: ImageObject[],
    preprocessingArgs: LoadInferenceDataArgs
  ): void {
    this._inferenceDataDims = images.map((im) => {
      const { height, width } = im.shape;
      const { padX, padY } = this._getPaddings(height, width);
      return { height, width, padY, padX };
    });

    this._inferenceDataset = preprocessStardist(
      images,
      1,
      this._inferenceDataDims
    );

    if (preprocessingArgs.kinds) {
      if (preprocessingArgs.kinds.length !== 1)
        throw Error(
          `${this.name} Model only takes a single foreground category`
        );
      this._fgKind = preprocessingArgs.kinds[0];
    } else if (!this._fgKind) {
      const unknownCategoryId = generateUUID({ definesUnknown: true });
      this._fgKind = {
        id: "Nucleus",
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

    if (!this._inferenceDataDims) {
      throw Error(
        `"${this.name}" Model's inference data dimensions and padding information not loaded`
      );
    }

    const graphModel = this._model as GraphModel;

    const infT = await this._inferenceDataset.toArray();
    // imTensor disposed in `predictStardist`
    const annotationsPromises = infT.map((imTensor, idx) => {
      return predictStardist(
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
    this._inferenceDataDims = undefined;
    this._fgKind = undefined;
    super.dispose();
  }
}
