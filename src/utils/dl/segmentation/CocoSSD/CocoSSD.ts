import { LayersModel, loadGraphModel } from "@tensorflow/tfjs";

import type { Kind } from "store/dataV2/types";

import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { predictCoco } from "./predictCoco";
import { preprocessInference } from "../AbstractSegmenter/preprocess";
import { constructCocoKinds } from "./constructCocoKinds";
import { ModelTask } from "../../enums";

import type { InferenceInput } from "../../types";
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
  protected _inferenceKinds?: Array<Kind>;

  constructor() {
    super({
      name: "COCO-SSD",
      task: ModelTask.Segmentation,
      graph: true,
      pretrained: true,
      trainable: false,
      src: "https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1",
      requiredChannels: 3,
    });
  }

  public async loadModel() {
    if (!this.src) return;
    if (this._model) return;

    this._model = await loadGraphModel(this.src);
  }

  public async predict(items: InferenceInput[], kinds?: Array<Kind>) {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    if (this._model instanceof LayersModel) {
      throw Error(`"${this.name}" Model must a Graph, not Layers`);
    }
    if (kinds) {
      this._inferenceKinds = kinds;
    } else if (!this._inferenceKinds) {
      this._inferenceKinds = constructCocoKinds();
    }

    const inferenceDataset = preprocessInference(items);
    const graphModel = this._model as GraphModel;

    const infT = await inferenceDataset.toArray();
    // imTensor disposed in `predictCoco`
    const annotationsPromises = infT.map((imTensor) => {
      return predictCoco(graphModel, imTensor, this._inferenceKinds!);
    });
    const annotations = await Promise.all(annotationsPromises);

    return annotations;
  }

  public inferenceCategoriesById(_catIds: Array<string>) {
    return [];
  }
  public inferenceKindsById(kinds: string[]) {
    if (!this._inferenceKinds) {
      throw Error(`"${this.name}" Model has no inference kinds loaded`);
    }

    return this._inferenceKinds.filter((kind) => kinds.includes(kind.id));
  }

  public override dispose() {
    super.dispose();
  }
}
