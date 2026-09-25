import JSZip from "jszip";

import { err, ok } from "../../utils";
import { CellposeSAM } from "../models/CellposeSAM";
import { CocoSSD } from "../models/CocoSSD";
import { Glas } from "../models/Glas";
import { StardistFluo, StardistVHE } from "../models/Stardist";
import { modelInfo } from "../models/modelInfo";

import type { Token } from "core/dl/cancel";

import type { LoadCB } from "utils/types";

import type {
  ISegmenterApi,
  ModelName,
  SegmentaionModelDetails,
  SegmentationResults,
  SegmenterOptionValues,
} from "../types";
import type { Segmenter } from "../models/AbstractSegmenter";
import type {
  InferenceInput,
  SerializedModelData,
  SerializedModels,
  ApiResult,
} from "../../types";

export class SegmenterHandler implements ISegmenterApi {
  private _availableSegmentationModels: Record<string, Segmenter> = {};
  // In-flight `loadModel` aborters, keyed by model name. See
  // `cancelLoadModel` for why the controller lives on this side.
  private _loadAborters = new Map<ModelName, AbortController>();

  constructor() {
    this._availableSegmentationModels = {
      "Cellpose-SAM": new CellposeSAM(),
      "COCO-SSD": new CocoSSD(),
      GlandSegmentation: new Glas(),
      StardistVHE: new StardistVHE(),
      StardistFluo: new StardistFluo(),
    };
  }

  /*
   * Model Information Access
   */
  private resolveModel(modelName: ModelName) {
    return this._availableSegmentationModels[modelName] ?? null;
  }

  private buildModelInfoDTO(model: Segmenter): SegmentaionModelDetails {
    return {
      name: model.name,
      displayName: modelInfo[model.name].displayName,
      kind: model.kind,
      modelLoaded: model.modelLoaded,
      channelPolicy: model.channelPolicy,
      optionSchema: model.optionSchema,
      cancellableLoad: model.cancellableLoad,
    };
  }

  public async getAvailableSegmentationModels() {
    return ok(
      Object.entries(this._availableSegmentationModels).reduce(
        (models: Record<string, SegmentaionModelDetails>, [name, model]) => {
          models[name] = this.buildModelInfoDTO(model);
          return models;
        },
        {},
      ),
    );
  }

  public async hasModel(modelName: ModelName) {
    return ok(modelName in this._availableSegmentationModels);
  }

  public async getModelNames() {
    return ok(Object.keys(this._availableSegmentationModels));
  }

  public async getModelInfo(modelName: ModelName) {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );
    return ok(this.buildModelInfoDTO(model));
  }

  /*
   * Segmentation Ops
   */

  public async loadModel(modelName: ModelName, loadCB?: LoadCB) {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );
    if (model.modelLoaded) return ok();

    const controller = new AbortController();
    this._loadAborters.set(modelName, controller);
    try {
      await model.loadModel(loadCB, controller.signal);
      return ok();
    } catch (e) {
      const error = e as Error;
      // `fromPretrained` rejects with a DOMException named "AbortError" when
      // the signal trips. That is a user action, not a failure.
      if (error.name === "AbortError")
        return err("LOAD_CANCELLED", `Cancelled loading "${modelName}"`, error);
      /*
       * Surface the underlying message rather than a fixed string. Loading can
       * fail in ways the user can act on — no WebGPU adapter, a failed download,
       * an exhausted IndexedDB quota — and callers only ever render
       * `reason.message`, never `reason.cause`.
       */
      return err("TF_LOAD_FAILED", error.message, error);
    } finally {
      this._loadAborters.delete(modelName);
    }
  }

  public async cancelLoadModel(modelName: ModelName) {
    this._loadAborters.get(modelName)?.abort();
    return ok();
  }
  public async predict(
    modelName: ModelName,
    items: InferenceInput[],
    cancelToken: Token,
    loadCB?: LoadCB,
    options?: SegmenterOptionValues,
  ): Promise<ApiResult<SegmentationResults>> {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );
    try {
      const result = await model.predict(items, cancelToken, loadCB, options);
      return ok(result);
    } catch (e) {
      const error = e as Error;
      return err("PREDICTION_FAILED", error.message, error.cause);
    }
  }

  public async getZippedModelsBuffer(): Promise<ApiResult<ArrayBuffer>> {
    try {
      const zip = new JSZip();
      const savedModelData = await this.getAllSavedModelData();
      Object.values(savedModelData).forEach((m) => {
        zip.file(m.modelJson.fileName, m.modelJson.blob);
        zip.file(m.modelWeights.fileName, m.modelWeights.blob);
      });
      const buffer = await zip.generateAsync({ type: "arraybuffer" });
      return ok(buffer);
    } catch (e) {
      return err("UNKNOWN", "Failed to generate zipped models buffer", e);
    }
  }
  public async getSavedModelData(
    modelName: ModelName,
  ): Promise<ApiResult<SerializedModelData>> {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );
    try {
      const savedModelInfo = await model.getSavedModelFiles();
      return ok({
        modelJson: {
          blob: savedModelInfo.modelJsonBlob,
          fileName: savedModelInfo.modelJsonFileName,
        },
        modelWeights: {
          blob: savedModelInfo.weightsBlob,
          fileName: savedModelInfo.weightsFileName,
        },
      });
    } catch (e) {
      return err("UNKNOWN", "Failed to get saved model data", e);
    }
  }
  private async getAllSavedModelData(): Promise<SerializedModels> {
    const userModels: SerializedModels = {};
    for await (const modelName of Object.keys(
      this._availableSegmentationModels,
    )) {
      const model = this._availableSegmentationModels[modelName];
      const savedModelInfo = await model.getSavedModelFiles();
      userModels[modelName] = {
        modelJson: {
          blob: savedModelInfo.modelJsonBlob,
          fileName: savedModelInfo.modelJsonFileName,
        },
        modelWeights: {
          blob: savedModelInfo.weightsBlob,
          fileName: savedModelInfo.weightsFileName,
        },
      };
    }
    return userModels;
  }
  async destroy() {
    Object.keys(this._availableSegmentationModels).forEach((modelName) => {
      const model = this._availableSegmentationModels[modelName];
      model.dispose();
      delete this._availableSegmentationModels[modelName];
    });
    return ok();
  }
}
