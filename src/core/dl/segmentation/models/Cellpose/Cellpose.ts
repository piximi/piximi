import { data as tfdata, scalar, tidy } from "@tensorflow/tfjs";
import { hyphaWebsocketClient } from "imjoy-rpc";

import { CancelSource, TaskCancelledError, type Token } from "core/dl/cancel";

import type { LoadCB } from "utils/types";

import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { predictCellpose } from "./predictCellpose";
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

  public async predict(
    items: InferenceInput[],
    cancelToken: Token,
    loadCb: LoadCB,
  ) {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }
    loadCb(0, "1/3 Preprocessing images");
    const inferenceDataset = this.loadInference(items);

    const infT = await inferenceDataset.toArray();
    loadCb(100, "1/3 Preprocessing images");
    const annotations: Array<PredictedAnnotationObject[]> = [];
    loadCb(-1, "2/3 Connecting to server");
    const api = await hyphaWebsocketClient.connectToServer(this._config);
    const triton = await api.getService(this._service);

    loadCb(100, "2/3 Connecting to server");
    try {
      for await (const [idx, imTensor] of infT.entries()) {
        CancelSource.throwIfSignaled(cancelToken);
        const annotObj = await predictCellpose(
          imTensor,
          this.segmentedKind,
          triton,
        );
        annotations.push(annotObj);

        loadCb(
          Math.round(((idx + 1) / infT.length) * 100),
          `3/3: Segmenting ${idx + 1} of ${infT.length} images`,
        );
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
