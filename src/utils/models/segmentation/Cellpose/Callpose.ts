import {
  GraphModel,
  History,
  Tensor4D,
  data as tfdata,
} from "@tensorflow/tfjs";

import {
  Segmenter,
  OrphanedAnnotationObject,
} from "../AbstractSegmenter/AbstractSegmenter";
import { predictCellpose } from "./predictCellpose";
import { FitOptions } from "../../types";
import { ModelTask } from "../../enums";
import { getImageSlice } from "utils/tensorUtils";
import { Kind, ImageObject } from "store/data/types";
import { LoadCB } from "utils/file-io/types";
import { generateKind } from "store/data/utils";
import { hyphaWebsocketClient } from "imjoy-rpc";

type LoadInferenceDataArgs = {
  fitOptions: FitOptions;
  // if cat undefined, created from default classes
  // if defined, it should be length 1, as only a foreground class is needed
  kinds?: Array<Kind>;
};

const KIND_NAME = "cellpose_cells";

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

  protected _fgKind?: Kind;

  constructor() {
    super({
      name: "Cellpose",
      kind: KIND_NAME,
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

  public loadTraining(_images: ImageObject[], _preprocessingArgs: any): void {}

  public loadValidation(
    _images: ImageObject[],
    _preprocessingArgs: any,
  ): void {}

  private _sampleGenerator(images: Array<ImageObject>) {
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
    images: ImageObject[],
    preprocessingArgs: LoadInferenceDataArgs,
  ): void {
    this._inferenceDataset = tfdata
      .generator(this._sampleGenerator(images))
      .batch(1) as tfdata.Dataset<Tensor4D>;

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

  public async predict(loadCb?: LoadCB) {
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

    const annotations: Array<OrphanedAnnotationObject[]> = [];
    const api = await hyphaWebsocketClient.connectToServer(this._config);

    const triton = await api.getService(this._service);
    for await (const [idx, imTensor] of infT.entries()) {
      // imTensor disposed in predictCellpose
      const annotObj = await predictCellpose(
        imTensor,
        this._fgKind!.id,
        this._fgKind!.unknownCategoryId,
        triton,
      );
      annotations.push(annotObj);
      if (loadCb) {
        loadCb(
          (idx + 1) / infT.length,
          `${idx + 1} of ${infT.length} images predicted`,
        );
      }
    }

    return annotations;
  }

  public inferenceKindsById(kinds: Array<string>) {
    if (!this._fgKind) {
      throw Error(`"${this.name}" Model has no foreground kind loaded`);
    }

    return kinds.includes(this._fgKind.id) ? [this._fgKind] : [];
  }
  public inferenceCategoriesById(_catIds: Array<string>) {
    return [];
  }

  public override dispose() {
    this._fgKind = undefined;
    super.dispose();
  }
}
