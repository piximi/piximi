import { LayersModel } from "@tensorflow/tfjs";

import type { LoadCB } from "utils/types";

import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { preprocessStardist } from "./preprocessStardist";
import { predictStardist } from "./predictStardist";

import type { PredictedAnnotationObject } from "../../types";
import type { InferenceInput } from "../../../types";
import type { GraphModel } from "@tensorflow/tfjs";

export const KIND_NAME = "stardist_nucleus";
/*
 * Abstract model for Stardist variants
 */
export abstract class Stardist extends Segmenter {
  protected readonly segmentedKind = KIND_NAME;

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

  public async predict(items: InferenceInput[], loadCb: LoadCB) {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    if (this._model instanceof LayersModel) {
      throw Error(`"${this.name}" Model must a Graph, not Layers`);
    }

    loadCb(0, "1/2 Preprocessing images");
    const inferenceDataDims = items.map((item) => {
      const { height, width } = item.shape;
      const { padX, padY } = this._getPaddings(height, width);
      return { height, width, padY, padX };
    });

    const inferenceDataset = preprocessStardist(
      items,
      1,
      inferenceDataDims,
      loadCb,
    );

    const graphModel = this._model as GraphModel;

    const infT = await inferenceDataset.toArray();
    loadCb(100, "1/2 Preprocessing images");
    const annotations: Array<PredictedAnnotationObject[]> = [];
    // imTensor disposed in `predictStardist`

    for await (const [idx, imTensor] of infT.entries()) {
      loadCb(Math.round((idx / infT.length) * 100), "2/2 Segmenting image");
      const annotObj = await predictStardist(
        graphModel,
        imTensor,
        this.segmentedKind,
        inferenceDataDims![idx],
      );
      annotations.push(annotObj);
    }

    return annotations;
  }

  public override dispose() {
    super.dispose();
  }
}
