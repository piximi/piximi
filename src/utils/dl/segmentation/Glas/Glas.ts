import { LayersModel } from "@tensorflow/tfjs";

import type { Kind } from "store/dataV2/types";
import { generateKind } from "store/dataV2/utils";

import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { preprocessGlas } from "./preprocessGlas";
import { predictGlas } from "./predictGlas";
import { ModelTask } from "../../enums";
import { loadGlas } from "./loadGlas";

import type { InferenceInput } from "../../types";
import type { GraphModel } from "@tensorflow/tfjs";

const KIND_NAME = "glas_glands";
/*
 * Gland Segmentation
 * Contest GitHub: http://github.com/twpkevin06222/Gland-Segmentation/tree/main
 * Kaggle dataset: https://www.kaggle.com/datasets/sani84/glasmiccai2015-gland-segmentation
 * Model GitHub: https://github.com/binli123/glas-tensorflow-deeplab
 * Contest paper: https://pubmed.ncbi.nlm.nih.gov/27614792/
 * Gland segmentation task with GlaS 2015 dataset using UNet model
 * Trained on images of Hematoxylin and Eosin (H&E) stained slides, consisting of a variety of histologic grades
 */
export class Glas extends Segmenter {
  protected _fgKind?: Kind;

  constructor() {
    super({
      name: "GlandSegmentation",
      task: ModelTask.Segmentation,
      kind: KIND_NAME,
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

  public async predict(items: InferenceInput[], kinds: Array<Kind>) {
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

    const graphModel = this._model as GraphModel;
    const inferenceDataDims = items.map((item) => {
      const { height, width } = item.shape;
      return { height, width };
    });
    const inferenceDataset = preprocessGlas(items, 1);

    const infT = await inferenceDataset.toArray();
    // imTensor disposed in `predictGlas`

    const annotationsPromises = infT.map((imTensor, idx) => {
      return predictGlas(
        graphModel,
        imTensor,
        this._fgKind!.id,
        this._fgKind!.unknownCategoryId,
        inferenceDataDims![idx],
      );
    });
    const annotations = await Promise.all(annotationsPromises);

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
