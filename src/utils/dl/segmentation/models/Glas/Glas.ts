import { LayersModel } from "@tensorflow/tfjs";

import type { LoadCB } from "utils/types";

import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { preprocessGlas } from "./preprocessGlas";
import { predictGlas } from "./predictGlas";
import { ModelTask } from "../../../enums";
import { loadGlas } from "./loadGlas";

import type { PredictedAnnotationObject } from "../../types";
import type { InferenceInput } from "../../../types";
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
  protected readonly segmentedKind = KIND_NAME;

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

  public async predict(items: InferenceInput[], loadCb: LoadCB) {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    if (this._model instanceof LayersModel) {
      throw Error(`"${this.name}" Model must a Graph, not Layers`);
    }

    const graphModel = this._model as GraphModel;
    loadCb(0, "1/2 Preprocessing images");
    const inferenceDataDims = items.map((item) => {
      const { height, width } = item.shape;
      return { height, width };
    });
    const inferenceDataset = preprocessGlas(items, 1);
    const annotations: Array<PredictedAnnotationObject[]> = [];
    const infT = await inferenceDataset.toArray();
    // imTensor disposed in `predictGlas`
    loadCb(100, "1/2 Preprocessing images");
    for await (const [idx, imTensor] of infT.entries()) {
      loadCb(Math.round((idx / infT.length) * 100), "2/2 Segmenting image");
      const annObj = await predictGlas(
        graphModel,
        imTensor,
        this.segmentedKind,
        inferenceDataDims![idx],
      );
      annotations.push(annObj);
    }

    return annotations;
  }

  public override dispose() {
    super.dispose();
  }
}
