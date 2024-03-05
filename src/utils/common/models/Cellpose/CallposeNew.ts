import {
  GraphModel,
  History,
  Tensor4D,
  data as tfdata,
} from "@tensorflow/tfjs";

import { ModelTask } from "types/ModelType";
import { FitOptions, ImageType } from "types";
import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { getImageSlice } from "utils/common/image";
import { Kind, NEW_UNKNOWN_CATEGORY_ID } from "types/Category";
import { predictCellposeNew } from "./predictCellposeNew";

type LoadInferenceDataArgs = {
  fitOptions: FitOptions;
  // if cat undefined, created from default classes
  // if defined, it should be length 1, as only a foreground class is needed
  kinds?: Array<Kind>;
};

/*
 * Cellpose
 * https://github.com/mouseland/cellpose
 * generalist instance segmentation model for cell and nucleus segmentation
 * This model is run in the cloud on BioEngine
 * https://slides.imjoy.io/?slides=https://raw.githubusercontent.com/oeway/slides/master/2022/i2k-2022-bioengine-workshop.md
 */
export class CellposeNew extends Segmenter {
  protected readonly _config = {
    name: "test client",
    server_url: "https://ai.imjoy.io",
    passive: true,
  };

  protected readonly _service = "triton-client";

  protected _fgKind?: Kind;

  constructor() {
    super({
      name: "CellposeNew",
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

    if (preprocessingArgs.kinds) {
      if (preprocessingArgs.kinds.length !== 1)
        throw Error(
          `${this.name} Model only takes a single foreground category`
        );
      this._fgKind = preprocessingArgs.kinds[0];
    } else if (!this._fgKind) {
      this._fgKind = {
        id: "Nucleus",
        categories: [NEW_UNKNOWN_CATEGORY_ID],
        containing: [],
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
    return [];
  }

  public async predictNew() {
    console.log("predictNew");
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    if (!this._inferenceDataset) {
      throw Error(`"${this.name}" Model's inference data not loaded`);
    }

    if (!this._fgKind) {
      throw Error(`"${this.name}" Model's foreground kind is not loaded`);
    }

    const infT = await this._inferenceDataset.toArray();

    const annotationPromises = infT.map((imTensor) => {
      // imTensor disposed in _predictOne
      return predictCellposeNew(
        imTensor,
        this._fgKind!.id,
        this._service,
        this._config
      );
    });

    console.log("annotationPromises: ", annotationPromises);

    const annotations = await Promise.all(annotationPromises);

    return annotations;
  }

  public inferenceKindsById(kinds: Array<string>) {
    if (!this._fgKind) {
      throw Error(`"${this.name}" Model has no foreground kind loaded`);
    }

    return kinds.includes(this._fgKind.id) ? [this._fgKind] : [];
  }
  public inferenceCategoriesById(catIds: Array<string>) {
    return [];
  }

  public override dispose() {
    this._fgKind = undefined;
    super.dispose();
  }
}
