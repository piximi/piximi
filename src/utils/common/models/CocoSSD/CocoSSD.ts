import {
  GraphModel,
  History,
  LayersModel,
  loadGraphModel,
} from "@tensorflow/tfjs";

import { ModelTask } from "types/ModelType";
import { Category, FitOptions, ImageType } from "types";
import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { predictCoco } from "./predictCoco";
import { preprocessInference } from "../AbstractSegmenter/preprocess";
import { constructCocoCategories } from "./constructCocoCategories";

type LoadInferenceDataArgs = {
  fitOptions: FitOptions;
  // if cat undefined, created from default classes
  categories?: Array<Category>;
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
  protected _inferenceCategories?: Array<Category>;

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

    const isTFHub = CocoSSD.verifyTFHubUrl(this.src);

    this._model = await loadGraphModel(this.src, { fromTFHub: isTFHub });
  }

  public loadTraining(images: ImageType[], preprocessingArgs: any): void {}
  public loadValidation(images: ImageType[], preprocessingArgs: any): void {}

  public loadInference(
    images: ImageType[],
    preprocessingArgs: LoadInferenceDataArgs
  ) {
    this._inferenceDataset = preprocessInference(
      images,
      preprocessingArgs.fitOptions
    );

    if (preprocessingArgs.categories) {
      this._inferenceCategories = preprocessingArgs.categories;
    } else if (!this._inferenceCategories) {
      this._inferenceCategories = constructCocoCategories();
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

    if (!this._inferenceCategories) {
      throw Error(`"${this.name}" Model's inference categories are not loaded`);
    }

    const graphModel = this._model as GraphModel;

    const infT = await this._inferenceDataset.toArray();
    // imTensor disposed in `predictCoco`
    const annotationsPromises = infT.map((imTensor) => {
      return predictCoco(graphModel, imTensor, this._inferenceCategories!);
    });
    const annotations = await Promise.all(annotationsPromises);

    return annotations;
  }

  public inferenceCategoriesById(catIds: Array<string>) {
    if (!this._inferenceCategories) {
      throw Error(`"${this.name}" Model has no inference categories loaded`);
    }

    return this._inferenceCategories.filter((cat) => catIds.includes(cat.id));
  }

  public override dispose() {
    super.dispose();
  }
}
