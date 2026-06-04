import JSZip from "jszip";

import type { Category } from "store/dataV2/types";

import { err, ok } from "../../utils";
import { Cellpose } from "../Cellpose";
import { CocoSSD } from "../CocoSSD";
import { Glas } from "../Glas";
import { StardistFluo, StardistVHE } from "../Stardist";

import type {
  ISegmenterApi,
  ModelInfoDTO,
  SegmentationResults,
} from "../types";
import type { Segmenter } from "../AbstractSegmenter";
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
      Glas: new Glas(),
      StardistVHE: new StardistVHE(),
      StardistFluo: new StardistFluo(),
    };
  }

  /*
   * Model Information Access
   */
  private resolveModel(modelName: string) {
    return this._availableSegmentationModels[modelName] ?? null;
  }

  private buildModelInfoDTO(model: Segmenter) {
    return {
      name: model.name,
      task: model.task,
      graph: model.graph,
      pretrained: model.pretrained,
      modelLoaded: model.modelLoaded,
      inferenceLoaded: model.inferenceLoaded,
      defaultInputShape: model.modelLoaded
        ? model.defaultInputShape
        : undefined,
      defaultOutputShape: model.modelLoaded
        ? model.defaultOutputShape
        : undefined,
      requiredChannels: model.requiredChannels,
    };
  }

  public get availableSegmentationModels() {
    return Object.entries(this._availableSegmentationModels).reduce(
      (models: Record<string, ModelInfoDTO>, [name, model]) => {
        models[name] = this.buildModelInfoDTO(model);
        return models;
      },
      {},
    );
  }

  public async hasModel(modelName: string) {
    return ok(modelName in this._availableSegmentationModels);
  }

  public async getModelNames() {
    return ok(Object.keys(this._availableSegmentationModels));
  }

  public async getModelInfo(modelName: string) {
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

  public async loadInference(
    modelName: string,
    items: InferenceInput[],
    categories: Category[],
  ) {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );
    try {
      model.loadInference(items, categories);
      return ok(modelName);
    } catch (e) {
      return err("PREPROCESS_FAILED", "Failed to load inference data", e);
    }
  }

  public async predict(
    modelName: string,
  ): Promise<ApiResult<SegmentationResults>> {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );
    try {
      const result = await model.predict();
      return ok(result);
    } catch (e) {
      return err("PREDICTION_FAILED", "Failed to predict", e);
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
    modelName: string,
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
