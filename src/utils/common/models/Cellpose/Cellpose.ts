import {
  GraphModel,
  History,
  Tensor4D,
  data as tfdata,
} from "@tensorflow/tfjs";
import { v4 as uuid } from "uuid";

import { ModelTask } from "types/ModelType";
import { Category, FitOptions, ImageType } from "types";
import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { CATEGORY_COLORS } from "utils/common/colorPalette";
import { getImageSlice } from "utils/common/image";
import { predictCellpose } from "./predictCellpose";

type LoadInferenceDataArgs = {
  fitOptions: FitOptions;
  // if cat undefined, created from default classes
  // if defined, it should be length 1, as only a foreground class is needed
  categories?: Array<Category>;
};

/*
 * Cellpose
 * https://github.com/mouseland/cellpose
 * generalist instance segmentation model for cell and nucleus segmentation
 * This model is run in the cloud on BioEngine
 * https://slides.imjoy.io/?slides=https://raw.githubusercontent.com/oeway/slides/master/2022/i2k-2022-bioengine-workshop.md
 */
export class Cellpose extends Segmenter {
  protected readonly _config = {
    name: "test client",
    server_url: "https://ai.imjoy.io",
    passive: true,
  };

  protected readonly _service = "triton-client";

  protected _fgCategory?: Category;

  constructor() {
    super({
      name: "Cellpose",
      task: ModelTask.Segmentation,
      graph: true,
      pretrained: true,
      trainable: false,
      requiredChannels: 3,
    });
  }

  public async loadModel() {
    if (this._model) return;
    // A bit silly, but Model expects a dispose method
    this._model = { dispose: () => {} } as GraphModel;
  }

  public loadTraining(images: ImageType[], preprocessingArgs: any): void {}

  public loadValidation(images: ImageType[], preprocessingArgs: any): void {}

  private _sampleGenerator(images: Array<ImageType>) {
    const count = images.length;

    return function* () {
      let index = 0;

      while (index < count) {
        const image = images[index];
        const dataPlane = getImageSlice(image.data, image.activePlane);

        yield dataPlane;

        index++;
      }
    };
  }

  public loadInference(
    images: ImageType[],
    preprocessingArgs: LoadInferenceDataArgs
  ): void {
    this._inferenceDataset = tfdata
      .generator(this._sampleGenerator(images))
      .batch(
        preprocessingArgs.fitOptions.batchSize
      ) as tfdata.Dataset<Tensor4D>;

    if (preprocessingArgs.categories) {
      if (preprocessingArgs.categories.length !== 1)
        throw Error(
          `${this.name} Model only takes a single foreground category`
        );
      this._fgCategory = preprocessingArgs.categories[0];
    } else if (!this._fgCategory) {
      this._fgCategory = {
        name: "Nucleus",
        visible: true,
        id: uuid(),
        color: CATEGORY_COLORS.darkcyan,
      };
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

    if (!this._inferenceDataset) {
      throw Error(`"${this.name}" Model's inference data not loaded`);
    }

    if (!this._fgCategory) {
      throw Error(`"${this.name}" Model's foreground category is not loaded`);
    }

    const infT = await this._inferenceDataset.toArray();

    const annotationPromises = infT.map((imTensor) => {
      // imTensor disposed in _predictOne
      return predictCellpose(
        imTensor,
        this._fgCategory!.id,
        this._service,
        this._config
      );
    });

    const annotations = await Promise.all(annotationPromises);

    return annotations;
  }

  public inferenceCategoriesById(catIds: Array<string>) {
    if (!this._fgCategory) {
      throw Error(`"${this.name}" Model has no foreground category loaded`);
    }

    return catIds.includes(this._fgCategory.id) ? [this._fgCategory] : [];
  }

  public override dispose() {
    this._fgCategory = undefined;
    super.dispose();
  }
}
