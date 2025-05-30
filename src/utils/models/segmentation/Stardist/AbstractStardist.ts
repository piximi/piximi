import { GraphModel, History, LayersModel } from "@tensorflow/tfjs";

import {
  OrphanedAnnotationObject,
  Segmenter,
} from "../AbstractSegmenter/AbstractSegmenter";
import { preprocessStardist } from "./preprocessStardist";
import { predictStardist } from "./predictStardist";
import { generateKind } from "store/data/utils";
import { LoadInferenceDataArgs } from "../../types";
import { Kind, ImageObject } from "store/data/types";
import { LoadCB } from "utils/file-io/types";

export const KIND_NAME = "stardist_nucleus";
/*
 * Abstract model for Stardist variants
 */
export abstract class Stardist extends Segmenter {
  protected _fgKind?: Kind;
  protected _inferenceDataDims?: Array<{
    width: number;
    height: number;
    padX: number;
    padY: number;
  }>;

  public abstract loadModel(): Promise<void>;

  public loadTraining(_images: ImageObject[], _preprocessingArgs: any): void {}

  public loadValidation(
    _images: ImageObject[],
    _preprocessingArgs: any,
  ): void {}

  // This Stardist model requires image dimensions to be a multiple of 16
  // (for VHE in particular), see:
  // https://github.com/stardist/stardist/blob/468c60552c8c93403969078e51bddc9c2c702035/stardist/models/model2d.py#L543
  // https://github.com/stardist/stardist/blob/master/stardist/models/model2d.py#L201C30-L201C30
  // and config here (under source -> grid):
  // https://bioimage.io/#/?tags=stardist&id=10.5281%2Fzenodo.6348084
  // https://bioimage.io/#/?tags=stardist&id=10.5281%2Fzenodo.6338614
  // basically, in the case of VHE: 2^3 * 2 = 16
  protected _getPaddings(height: number, width: number) {
    const padY = height % 16 === 0 ? 0 : 16 - (height % 16);
    const padX = width % 16 === 0 ? 0 : 16 - (width % 16);

    return { padY, padX };
  }

  public loadInference(
    images: ImageObject[],
    preprocessingArgs: LoadInferenceDataArgs,
  ): void {
    this._inferenceDataDims = images.map((im) => {
      const { height, width } = im.shape;
      const { padX, padY } = this._getPaddings(height, width);
      return { height, width, padY, padX };
    });

    this._inferenceDataset = preprocessStardist(
      images,
      1,
      this._inferenceDataDims,
    );

    if (preprocessingArgs.kinds) {
      if (preprocessingArgs.kinds.length !== 1)
        throw Error(
          `${this.name} Model only takes a single foreground category`,
        );
      this._fgKind = preprocessingArgs.kinds[0];
    } else if (!this._fgKind) {
      const { kind } = generateKind(KIND_NAME, true);
      this._fgKind = kind;
    }
  }

  public async train(_options: any, _callbacks: any): Promise<History> {
    if (!this.trainable) {
      throw new Error(`Training not supported for Model ${this.name}`);
    } else {
      throw new Error(`Training not yet implemented for Model ${this.name}`);
    }
  }

  public async predict(loadCb?: LoadCB) {
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
        `"${this.name}" Model's inference data dimensions and padding information not loaded`,
      );
    }

    const graphModel = this._model as GraphModel;

    const infT = await this._inferenceDataset.toArray();
    const annotations: Array<OrphanedAnnotationObject[]> = [];
    // imTensor disposed in `predictStardist`
    for await (const [idx, imTensor] of infT.entries()) {
      const annotObj = await predictStardist(
        graphModel,
        imTensor,
        this._fgKind!.id,
        this._fgKind!.unknownCategoryId,
        this._inferenceDataDims![idx],
      );
      annotations.push(annotObj);
      if (loadCb) {
        loadCb(
          (idx + 1) / infT.length,
          `${idx + 1} of ${infT.length} images predicted`,
        );
      }
    }

    return annotations;
  }

  public inferenceCategoriesById(_catIds: Array<string>) {
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
