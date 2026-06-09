import { data as tfdata, scalar, tidy } from "@tensorflow/tfjs";

import type { LoadCB } from "utils/types";

import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { predictCellpose } from "./predictCellpose";
import { ModelTask } from "../../../enums";
import { channelsToTensor } from "../../../tensor-assembly";

import type { PredictedAnnotationObject } from "../../types";
import type { InferenceInput } from "../../../types";
import type { GraphModel, Tensor3D, Tensor4D } from "@tensorflow/tfjs";

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

  protected readonly segmentedKind = KIND_NAME;

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

  private loadInference(items: InferenceInput[]): tfdata.Dataset<Tensor4D> {
    const count = items.length;
    const indices = tfdata.generator(function* () {
      for (let i = 0; i < count; i++) yield i;
    });

    const inferenceDataset = indices
      .mapAsync(async (value) => {
        const item = items[value as number];
        const xs = await channelsToTensor(
          item.channelsRef,
          item.shape,
          item.region,
        );
        const bitDepth = item.channelsRef[0].bitDepth;
        const normalized = tidy(
          () => xs.div(scalar(2 ** bitDepth - 1)) as Tensor3D,
        );
        xs.dispose();
        return normalized;
      })
      .batch(1) as tfdata.Dataset<Tensor4D>;

    return inferenceDataset;
  }

  public async predict(items: InferenceInput[], loadCb?: LoadCB) {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    const inferenceDataset = this.loadInference(items);

    const infT = await inferenceDataset.toArray();

    const annotations: Array<PredictedAnnotationObject[]> = [];
    for await (const [idx, imTensor] of infT.entries()) {
      // imTensor disposed in predictCellpose
      const annotObj = await predictCellpose(
        imTensor,
        this.segmentedKind,
        this._service,
        this._config,
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

  public override dispose() {
    super.dispose();
  }
}
