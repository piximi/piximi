import { GraphModel, History, LayersModel } from "@tensorflow/tfjs";

import { ModelTask } from "types/ModelType";
import { Category, FitOptions, ImageType } from "types";
import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { loadStardist } from "./loadStardist";
import { preprocessStardist } from "./preprocessStardist";
import { predictStardist } from "./predictStardist";

type LoadInferenceDataArgs = {
  fitOptions: FitOptions;
  // if cat undefined, created from default classes
  // if defined, first one is taken as foreground class
  // TODO - segmenter: a bit clunky
  categories?: Array<Category>;
};

/*
 * Stardist (Versatile) H&E Nuclei Segmentation
 * https://zenodo.org/record/6338615
 * https://bioimage.io/#/?tags=stardist&id=10.5281%2Fzenodo.6338614&type=model
 * https://github.com/stardist/stardist/blob/master/README.md#pretrained-models-for-2d
 * Stardist: model for object detection / instance segmentation with star-convex shapes
 * This pretrained model: meant to segment individual cell nuclei from brightfield images with H&E staining
 */
export class StardistVHE extends Segmenter {
  _fgCategory?: Category;

  constructor() {
    super({
      name: "StardistVHE",
      task: ModelTask.Segmentation,
      graph: true,
      pretrained: true,
      trainable: false,
      requiredChannels: 3, // TODO - segmenter, correct?
    });
  }

  async loadModel() {
    // inputs: [ {name: 'input', shape: [-1,-1,-1,3], dtype: 'float32'} ]
    // outputs: [ {name: 'concatenate_4/concat', shape: [-1, -1, -1, 33], dtype: 'float32'} ]
    // where each -1 matches on input and output of corresponding dim/axis
    // 33 -> 1 x, followed by 32 radial equiangular distances of rays
    this._model = await loadStardist();
  }

  loadTraining(images: ImageType[], preprocessingArgs: any): void {}

  loadValidation(images: ImageType[], preprocessingArgs: any): void {}

  loadInference(
    images: ImageType[],
    preprocessingArgs: LoadInferenceDataArgs
  ): void {
    this._inferenceDataset = preprocessStardist(
      images,
      preprocessingArgs.fitOptions
    );

    if (preprocessingArgs.categories) {
      this._fgCategory = preprocessingArgs.categories[0];
    } else if (!this._fgCategory) {
      // TODO - segmenter
    }
  }

  async train(options: any, callbacks: any): Promise<History> {
    // TODO - segmenter: remove this placeholder
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
      throw Error(`"${this.name}" Model's inference data not loaded`);
    }

    if (!this._fgCategory) {
      throw Error(`"${this.name}" Model's foreground category is not loaded`);
    }

    const graphModel = this._model as GraphModel;

    const infT = await this._inferenceDataset.toArray();
    // imTensor disposed in `predictStardist`
    const annotationsPromises = infT.map((imTensor) => {
      return predictStardist(graphModel, imTensor, this._fgCategory!.id);
    });
    const annotations = await Promise.all(annotationsPromises);

    return annotations;
  }

  evaluate() {}
}
