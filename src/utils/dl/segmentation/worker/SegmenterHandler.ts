import JSZip from "jszip";

import type { LoadCB } from "utils/types";
import type { Token } from "utils/dl/cancel";

import { err, ok } from "../../utils";
import { Cellpose } from "../models/Cellpose";
import { CocoSSD } from "../models/CocoSSD";
import { Glas } from "../models/Glas";
import { StardistFluo, StardistVHE } from "../models/Stardist";
import { modelInfo } from "../models/modelInfo";

import type {
  ISegmenterApi,
  ModelName,
  SegmentaionModelDetails,
  SegmentationResults,
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

  constructor() {
    this._availableSegmentationModels = {
      Cellpose: new Cellpose(),
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
      defaultInputShape: model.modelLoaded
        ? model.defaultInputShape
        : undefined,
      defaultOutputShape: model.modelLoaded
        ? model.defaultOutputShape
        : undefined,
      requiredChannels: model.requiredChannels,
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

  public async loadModel(modelName: ModelName) {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );
    if (model.modelLoaded) return ok();
    try {
      await model.loadModel();
      return ok();
    } catch (e) {
      return err("TF_LOAD_FAILED", "Failed to load model", e);
    }
  }
  public async predict(
    modelName: ModelName,
    items: InferenceInput[],
    cancelToken: Token,
    loadCB?: LoadCB,
  ): Promise<ApiResult<SegmentationResults>> {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );
    try {
      const result = await model.predict(items, cancelToken, loadCB);
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
