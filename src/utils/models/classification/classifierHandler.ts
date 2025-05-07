import JSZip from "jszip";
import { SequentialClassifier } from "./AbstractClassifier";
import { RemoteClassifier, UploadedClassifier } from "./UploadedClassifier";
import { MobileNet } from "./MobileNet";
import { SimpleCNN } from "./SimpleCNN";
import { logger } from "utils/logUtils";
import { recursiveAssign } from "utils/objectUtils";
import { ModelTask } from "../enums";
import { getUniqueName } from "utils/stringUtils";
import { SerializedModels } from "../types";

export type ModelUploadResults = {
  loadedModels: SequentialClassifier[];
  failedModels: Record<
    string,
    {
      reason: string;
      err?: Error;
    }
  >;
};

class ClassifierHandler {
  readonly _availableClassifierArchitectures: [
    typeof SimpleCNN,
    typeof MobileNet,
  ] = [SimpleCNN, MobileNet];
  private _availableClassificationModels: Record<string, SequentialClassifier> =
    {};

  constructor(
    models?: Record<string, SequentialClassifier> | Array<SequentialClassifier>,
  ) {
    if (Array.isArray(models)) {
      this._availableClassificationModels = models.reduce(
        (acc: Record<string, SequentialClassifier>, model) => {
          acc[model.name] = model;
          return acc;
        },
        {},
      );
    } else {
      this._availableClassificationModels = models || {};
    }
  }

  public get availableClassifierArchitectures() {
    return this._availableClassifierArchitectures;
  }

  public get availableClassificationModels() {
    return this._availableClassificationModels;
  }
  public getModel(modelName: string) {
    return this._availableClassificationModels[modelName];
  }

  public getModelArchitecture(modelIndex: number) {
    return this._availableClassifierArchitectures[modelIndex];
  }

  public getModelNames() {
    return Object.keys(this._availableClassificationModels);
  }
  async createNewModel(
    modelName: string,
    architecture: 0 | 1,
  ): Promise<SequentialClassifier> {
    modelName = getUniqueName(modelName, this.getModelNames());
    try {
      const model = new this._availableClassifierArchitectures[architecture](
        modelName,
      );
      this._availableClassificationModels[modelName] = model;
      return model;
    } catch (err: any) {
      throw new Error("Failed to create Model.", { cause: err as Error });
    }
  }
  public addModels(
    models: Record<string, SequentialClassifier> | Array<SequentialClassifier>,
  ) {
    if (Array.isArray(models)) {
      models.forEach((model) => {
        this._availableClassificationModels[model.name] = model;
      });
    } else {
      Object.entries(models).forEach(([name, model]) => {
        this._availableClassificationModels[name] = model;
      });
    }
  }

  public removeModel(modelName: string) {
    const model = this.availableClassificationModels[modelName];
    model.dispose();
    delete this.availableClassificationModels[modelName];
  }
  public removeAllModels() {
    Object.values(this.availableClassificationModels).forEach((model) => {
      model.dispose();
    });
    this._availableClassificationModels = {};
  }
  public async modelFromFiles(
    descFile: File,
    weightsFiles: File[],
    isGraph?: boolean,
    modelName?: string,
  ) {
    const failedModels: Record<string, { reason: string; err?: Error }> = {};
    const loadedModels: SequentialClassifier[] = [];
    modelName = modelName ?? descFile.name.replace(/\..+$/, "");
    const uniqueName = getUniqueName(modelName, this.getModelNames());

    const model = new UploadedClassifier({
      descFile,
      weightsFiles,
      name: uniqueName,
      task: ModelTask.Classification,
      graph: !!isGraph,
      pretrained: true,
      trainable: true,
    });
    try {
      await model.upload();
      loadedModels.push(model);
    } catch (err) {
      failedModels[modelName] = {
        reason: "Model upload failed",
        err: err as Error,
      };
    }
    return { loadedModels, failedModels };
  }

  public async modelFromUrl(
    modelUrl: string,
    fromTFHub: boolean,
    isGraph: boolean,
  ) {
    const failedModels: Record<string, { reason: string; err?: Error }> = {};
    const loadedModels: SequentialClassifier[] = [];
    const modelName = getUniqueName("Remote-Classifier", this.getModelNames());
    const model = new RemoteClassifier({
      name: modelName,
      task: ModelTask.Classification,
      pretrained: true,
      trainable: isGraph,
      TFHub: fromTFHub,
      graph: isGraph,
      src: modelUrl,
    });

    try {
      await model.upload();
      loadedModels.push(model);
    } catch (err) {
      failedModels[modelName] = {
        reason: `Failed to load model: ${err}`,
        err: err as Error,
      };
    }
    return { loadedModels, failedModels };
  }
  public async modelsFromZip(zip: JSZip) {
    const modelFileRegEx = new RegExp(".json$|.weights.bin$");
    const models: Record<
      string,
      {
        modelJson?: File;
        modelWeights?: File;
      }
    > = {};
    const failedModels: Record<string, { reason: string; err?: Error }> = {};
    const loadedModels: SequentialClassifier[] = [];

    for await (const [fileName, file] of Object.entries(zip.files)) {
      if (!modelFileRegEx.test(fileName)) continue;

      const parsedFileName = fileName.split(".");
      const modelName = parsedFileName[0];
      const extension = parsedFileName.at(1);

      const fileBuffer = await file.async("arraybuffer");
      if (extension === "json") {
        if (modelName in models && "modelJson" in models[modelName]) {
          logger(`Duplicate '.${extension}' file for ${modelName}`, {
            level: "warn",
          });
        }
        const modelFile = new File([fileBuffer], fileName, {
          type: "application/json",
        });
        recursiveAssign(models, {
          [modelName]: { modelJson: modelFile },
        });
      } else {
        const modelFile = new File([fileBuffer], fileName, {
          type: "application.octet-stream",
        });
        recursiveAssign(models, { [modelName]: { modelWeights: modelFile } });
      }
    }

    for await (const modelName of Object.keys(models)) {
      const { modelJson, modelWeights } = models[modelName];
      if (!modelJson) {
        failedModels[modelName] = {
          reason: "Missing '.json' description file.",
        };
      } else if (!modelWeights) {
        failedModels[modelName] = {
          reason: "Missing '.bin' weights file.",
        };
      } else {
        const result = await this.modelFromFiles(modelJson, [modelWeights]);
        loadedModels.push(...result.loadedModels);
        Object.assign(failedModels, result.failedModels);
      }
    }
    return { loadedModels, failedModels };
  }
  public async getSavedModelData() {
    const userModels: SerializedModels = {};
    for await (const modelName of this.getModelNames()) {
      const model = classifierHandler.getModel(modelName);
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
  public zipModels() {
    const zip = new JSZip();
    const savedModelData = this.getSavedModelData();
    Object.values(savedModelData).forEach((model) => {
      zip.file(model.modelJson.fileName, model.modelJson.blob);
      zip.file(model.modelWeights.fileName, model.modelWeights.blob);
    });
    return zip;
  }
}

const classifierHandler = new ClassifierHandler();
export default classifierHandler;
