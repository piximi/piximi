import { LayersModel } from "@tensorflow/tfjs";

import { generateKind } from "store/dataV2/utils";
import type { Kind } from "store/dataV2/types";

import type { LoadCB } from "utils/types";

import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { preprocessStardist } from "./preprocessStardist";
import { predictStardist } from "./predictStardist";

import type { PredictedAnnotationObject } from "../types";
import type { InferenceInput } from "../../types";
import type { GraphModel } from "@tensorflow/tfjs";

export const KIND_NAME = "stardist_nucleus";
/*
 * Abstract model for Stardist variants
 */
export abstract class Stardist extends Segmenter {
  protected _fgKind?: Kind;

  public abstract loadModel(): Promise<void>;

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

  public async predict(
    items: InferenceInput[],
    kinds: Array<Kind>,
    loadCb?: LoadCB,
  ) {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    if (this._model instanceof LayersModel) {
      throw Error(`"${this.name}" Model must a Graph, not Layers`);
    }

    if (kinds) {
      if (kinds.length !== 1)
        throw Error(
          `${this.name} Model only takes a single foreground category`,
        );
      this._fgKind = kinds[0];
    } else if (!this._fgKind) {
      const { kind } = generateKind(KIND_NAME, true);
      this._fgKind = kind;
    }

    const inferenceDataDims = items.map((item) => {
      const { height, width } = item.shape;
      const { padX, padY } = this._getPaddings(height, width);
      return { height, width, padY, padX };
    });
    const inferenceDataset = preprocessStardist(items, 1, inferenceDataDims);

    const graphModel = this._model as GraphModel;

    const infT = await inferenceDataset.toArray();
    const annotations: Array<PredictedAnnotationObject[]> = [];
    // imTensor disposed in `predictStardist`
    for await (const [idx, imTensor] of infT.entries()) {
      const annotObj = await predictStardist(
        graphModel,
        imTensor,
        this._fgKind!.id,
        this._fgKind!.unknownCategoryId,
        inferenceDataDims![idx],
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
    this._fgKind = undefined;
    super.dispose();
  }
}
