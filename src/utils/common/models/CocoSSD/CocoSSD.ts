import {
  //GraphModel,
  History,
  LayersModel,
  loadGraphModel,
} from "@tensorflow/tfjs";

import { ModelTask } from "types/ModelType";
import { Category, FitOptions, ImageType } from "types";
import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
//import { predictCoco } from "./predictCoco";
import { preprocessInference } from "../AbstractSegmenter/preprocess";
import { constructCocoCategories } from "./constructCocoCategories";

type LoadInferenceDataArgs = {
  fitOptions: FitOptions;
  categories: Array<Category>;
};

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
  _inferenceCategories?: Array<Category>;

  constructor() {
    super({
      name: "COCO-SSD",
      task: ModelTask.Segmentation,
      graph: true,
      pretrained: false,
      trainable: false,
      src: "https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1",
    });
  }

  async loadModel() {
    if (!this.src) return;

    const isTFHub = CocoSSD.verifyTFHubUrl(this.src);

    this._model = await loadGraphModel(this.src, { fromTFHub: isTFHub });
  }

  loadTraining(images: ImageType[], preprocessingArgs: any): void {}
  loadValidation(images: ImageType[], preprocessingArgs: any): void {}

  loadInference(images: ImageType[], preprocessingArgs: LoadInferenceDataArgs) {
    this._inferenceDataset = preprocessInference(
      images,
      preprocessingArgs.fitOptions
    );

    this._inferenceCategories = preprocessingArgs.categories;
  }

  constructCategories() {
    return constructCocoCategories();
  }

  async train(options: any, callbacks: any): Promise<History> {
    return this._history!;
  }

  async predict() {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    if (this._model instanceof LayersModel) {
      throw Error(`"${this.name}" Model must a Graph, not Layers`);
    }

    if (!this._inferenceDataset) {
      throw Error(`"${this.name}" Model's inferences data not loaded`);
    }

    if (!this._inferenceCategories) {
      throw Error(
        `"${this.name}" Model's inferences categegories are not loaded`
      );
    }

    // const graphModel = this._model as GraphModel;

    // // TODO - segmenter: is this 4D or 3D???
    // const infT = await this._inferenceDataset.toArray();
    // imTensor disposed in `predictCoco`
    // const annotationsPromises = infT.map((imTensor) =>
    //   predictCoco(graphModel, imTensor, this._inferenceCategories!)
    // );
    //const annotations = await Promise.all(annotationsPromises);
    console.log("done?");
  }

  evaluate() {}
}