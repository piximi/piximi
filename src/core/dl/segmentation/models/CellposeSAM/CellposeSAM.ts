import { Cellpose as CellposeJs, configureOrt } from "cellpose-js";

import { channelsToTensor } from "core/dl/tensor-assembly";
import { CancelSource, type CancelToken } from "core/dl/cancel";

import { Segmenter } from "../AbstractSegmenter/AbstractSegmenter";
import { predictCellposeSAM } from "./predictCellposeSAM";
import {
  CELLPOSE_OPTION_SCHEMA,
  CELLPOSE_PASSTHROUGH_CHANNELS,
  isCellposePassthrough,
  toCellposeSegmentOptions,
} from "./options";

import type { SegmentInput } from "cellpose-js";
import type { GraphModel } from "@tensorflow/tfjs";

import type { InferenceInput } from "core/dl/types";

import type { LoadCB } from "utils/types";

import type {
  PredictedAnnotationObject,
  SegmenterOptionValues,
} from "../../types";

const KIND_NAME = "cellpose_cells";

// URL prefix (same-origin) where ORT-web's WASM/JSEP sidecar files are served.
// See scripts/copyOrtWasm.js, which copies them into public/ort/.
const ORT_WASM_PATH = "/ort/";

// 588 MB FP16 ONNX model. Defaults to the public HuggingFace copy; override via
// the VITE_CELLPOSE_SAM_MODEL_URL env var to self-host.
const MODEL_URL =
  (import.meta.env.VITE_CELLPOSE_SAM_MODEL_URL as string | undefined) ??
  "https://huggingface.co/ballon999/cellpose-sam-onnx/resolve/main/cpsam_fp16.onnx";

/*
 * Cellpose-SAM (browser-side)
 * https://github.com/belkassaby/Cellpose.js
 *
 * Generalist instance segmentation for cells/nuclei, running fully in-browser on
 * WebGPU via ONNX Runtime Web (no server, unlike the cloud `Cellpose` model).
 * Requires a WebGPU-capable browser with native Float16Array (Chrome >=135 /
 * Safari >=17.4); `fromPretrained` throws `UnsupportedEnvironmentError` otherwise.
 */
export class CellposeSAM extends Segmenter {
  protected readonly segmentedKind = KIND_NAME;

  private _cp?: CellposeJs;

  constructor() {
    super({
      name: "Cellpose-SAM",
      kind: KIND_NAME,
      /*
       * Channel-agnostic: cellpose-js normalizes each source channel
       * independently and truncates to the first 3, so there is nothing to map
       * onto named model inputs.
       */
      channelPolicy: {
        mode: "passthrough",
        maxChannels: CELLPOSE_PASSTHROUGH_CHANNELS,
      },
      optionSchema: CELLPOSE_OPTION_SCHEMA,
      cancellableLoad: true,
    });
  }

  public async loadModel(loadCb: LoadCB, signal?: AbortSignal) {
    if (this._model) return;
    const MODEL_BYTES = 616_901_562;
    let lastPct = -1;

    configureOrt({ wasmPaths: ORT_WASM_PATH });

    loadCb(0, "Checking for cached model");
    /*
     * Deliberately unguarded. A swallowed rejection here would still install
     * the `_model` stand-in below, so `modelLoaded` would report true while
     * `_cp` stayed undefined — `SegmenterHandler.loadModel` then short-circuits
     * every retry with `ok()` and the failure only resurfaces from `predict`,
     * unrecoverable short of a reload. Let it propagate to TF_LOAD_FAILED.
     */
    this._cp = await CellposeJs.fromPretrained(MODEL_URL, {
      preload: true,
      ...(signal ? { signal } : {}),
      onProgress: ({ loaded, total }) => {
        const pct = Math.floor((loaded / (total ?? MODEL_BYTES)) * 100);
        if (pct === lastPct) return; // at most 101 calls instead of ~10,000
        lastPct = pct;
        loadCb(
          pct,
          `Downloading Cellpose-SAM model: ${(loaded / 1e6).toFixed(0)}/${589} MB`,
        );
      },
      onStatus: (status) => {
        loadCb(-1, status);
      },
    });

    // cellpose-js is not a TFJS model, but the Model/Segmenter machinery expects
    // a disposable `_model` handle (and uses it to report `modelLoaded`). Mirror
    // the cloud `Cellpose` model and install a no-op stand-in. Assigned only on
    // success, so a failed load leaves the segmenter retryable.
    this._model = {
      dispose: () => {
        this._cp?.dispose();
        this._cp = undefined;
      },
    } as GraphModel;
  }

  private async toSegmentInput(
    item: InferenceInput,
    passthrough: boolean,
  ): Promise<SegmentInput> {
    /*
     * In passthrough mode cellpose-js reads only the first 3 channels, so
     * fetching the rest would allocate an interleaved buffer it throws away.
     * Legacy mode must keep them all — `chan = k` may index any source channel.
     */
    const channelsRef = passthrough
      ? item.channelsRef.slice(0, CELLPOSE_PASSTHROUGH_CHANNELS)
      : item.channelsRef;
    const xs = await channelsToTensor(channelsRef, item.shape, item.region);
    // channelsToTensor yields interleaved HWC Float32 raw pixel values.
    // cellpose-js normalizes per-channel internally (percentile normalize99),
    // so the raw values are passed straight through.
    const data = (await xs.data()) as Float32Array;
    const [height, width, channels] = xs.shape;
    xs.dispose();
    return { data, width, height, channels };
  }

  public async predict(
    items: InferenceInput[],
    cancelToken: CancelToken,
    loadCb: LoadCB,
    options?: SegmenterOptionValues,
  ) {
    if (!this._cp) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    // Identical for every image; only `onTileProgress` varies per item.
    const segmentOptions = toCellposeSegmentOptions(options);
    const passthrough = isCellposePassthrough(options);

    const annotations: Array<PredictedAnnotationObject[]> = [];
    let failedImages = 0;
    try {
      for await (const [idx, item] of items.entries()) {
        await CancelSource.throwIfSignaled(cancelToken);
        const input = await this.toSegmentInput(item, passthrough);
        if (loadCb) {
          loadCb(
            Math.round((idx / items.length) * 100),
            `Segmenting image ${idx + 1} of ${items.length}`,
          );
        }
        try {
          const annotObj = await predictCellposeSAM(
            this._cp,
            input,
            this.segmentedKind,
            {
              ...segmentOptions,
              onTileProgress: (done, total) =>
                loadCb?.(
                  Math.round(((idx + done / total) / items.length) * 100),
                  `Segmenting image ${idx + 1} of ${items.length} — tile ${done}/${total}`,
                ),
            },
          );
          annotations.push(annotObj);
        } catch (e) {
          console.error(e);
          failedImages++;
        }
      }
    } catch (err) {
      if ((err as Error).name === "TaskCancelledError")
        return { cancelled: true, annotations };
      else {
        throw err as Error;
      }
    }
    if (failedImages > 0)
      loadCb(100, `2/2 Error segmenting ${failedImages} of ${items.length}`);
    return { annotations };
  }

  public override dispose() {
    void this._cp?.dispose();
    this._cp = undefined;
    super.dispose();
  }
}
