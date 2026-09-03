import { LayersModel, loadGraphModel } from "@tensorflow/tfjs";

import { CancelSource, TaskCancelledError, type Token } from "core/dl/cancel";

import type { LoadCB } from "utils/types";

import COCO_CLASSES from "data/model-data/cocossd-classes";

import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { predictCoco } from "./predictCoco";
import { preprocessInference } from "../AbstractSegmenter/preprocess";

import type { PredictedAnnotationObject } from "../../types";
import type { InferenceInput } from "../../../types";
import type { GraphModel } from "@tensorflow/tfjs";

/*
  SSD with MobileNet (v2) backbone, initialized with Imagenet classification checkpoint,
  and trained on COCO 2017 dataset.
  Ther are several variants on TFHub
  - v1: https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v1/1/default/1
    - model json
      - TF Hub: https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v1/1/default/1
      - mirror: https://storage.googleapis.com/tfjs-models/savedmodel/ssd_mobilenet_v1/model.json
  - v2: https://tfhub.dev/tensorflow/ssd_mobilenet_v2/2
    - model json
      - TF Hub: https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1
      - mirror: https://storage.googleapis.com/tfjs-models/savedmodel/ssd_mobilenet_v2/model.json
  - v2 light: https://tfhub.dev/tensorflow/tfjs-model/ssdlite_mobilenet_v2/1/default/1
    - model json
      - TF Hub: https://tfhub.dev/tensorflow/tfjs-model/ssdlite_mobilenet_v2/1/default/1
      - mirror: https://storage.googleapis.com/tfjs-models/savedmodel/ssdlite_mobilenet_v2/model.json
  Also published package on NPM here: https://www.npmjs.com/package/@tensorflow-models/coco-ssd
  Github here: https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd
  with the 80 outputclasses listed here:
  https://github.com/tensorflow/tfjs-models/blob/master/coco-ssd/src/classes.ts
 */

export class CocoSSD extends Segmenter {
  protected readonly segmentedKinds = Object.keys(COCO_CLASSES);

  constructor() {
    super({
      name: "COCO-SSD",
      kind: Object.keys(COCO_CLASSES),
      src: "https://storage.googleapis.com/tfjs-models/savedmodel/ssd_mobilenet_v1/model.json",
      requiredChannels: 3,
    });
  }

  public async loadModel() {
    if (!this.src) return;
    if (this._model) return;

    this._model = await loadGraphModel(this.src);
  }

  public async predict(
    items: InferenceInput[],
    cancelToken: Token,
    loadCb: LoadCB,
  ) {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    if (this._model instanceof LayersModel) {
      throw Error(`"${this.name}" Model must a Graph, not Layers`);
    }
    loadCb(0, "1/2 Preprocessing images");
    const inferenceDataset = preprocessInference(items);
    const graphModel = this._model as GraphModel;

    const infT = await inferenceDataset.toArray();
    loadCb(100, "1/2 Preprocessing images");
    // imTensor disposed in `predictCoco`
    const annotations: Array<PredictedAnnotationObject[]> = [];
    try {
      for await (const [idx, imTensor] of infT.entries()) {
        CancelSource.throwIfSignaled(cancelToken);
        loadCb(Math.round((idx / infT.length) * 100), "2/2 Segmenting image");
        const annotObj = await predictCoco(
          graphModel,
          imTensor,
          this.segmentedKinds,
        );
        annotations.push(annotObj);
      }
    } catch (err) {
      if (err instanceof TaskCancelledError)
        return { cancelled: true, annotations };
      else throw err as Error;
    }

    return { annotations };
  }

  public override dispose() {
    super.dispose();
  }
}
