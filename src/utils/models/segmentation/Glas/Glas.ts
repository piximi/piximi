import { GraphModel, History, LayersModel } from "@tensorflow/tfjs";
import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { preprocessGlas } from "./preprocessGlas";
import { predictGlas } from "./predictGlas";
import { LoadInferenceDataArgs } from "../../types";
import { ModelTask } from "../../enums";
import { Kind, ImageObject } from "store/data/types";
import { loadGlas } from "./loadGlas";
import { generateKind } from "store/data/utils";

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
  protected _inferenceDataDims?: Array<{
    width: number;
    height: number;
  }>;
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

  public loadTraining(_images: ImageObject[], _preprocessingArgs: any): void {}

  public loadValidation(
    _images: ImageObject[],
    _preprocessingArgs: any,
  ): void {}

  public loadInference(
    images: ImageObject[],
    preprocessingArgs: LoadInferenceDataArgs,
  ): void {
    this._inferenceDataDims = images.map((im) => {
      const { height, width } = im.shape;
      return { height, width };
    });
    this._inferenceDataset = preprocessGlas(images, 1);

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

    if (!this._fgKind) {
      throw Error(`"${this.name}" Model's foreground kind is not loaded`);
    }

    const graphModel = this._model as GraphModel;

    const infT = await this._inferenceDataset.toArray();
    // imTensor disposed in `predictGlas`

    const annotationsPromises = infT.map((imTensor, idx) => {
      return predictGlas(
        graphModel,
        imTensor,
        this._fgKind!.id,
        this._fgKind!.unknownCategoryId,
        this._inferenceDataDims![idx],
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
