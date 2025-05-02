import JSZip from "jszip";
import { SequentialClassifier } from "./AbstractClassifier";
import { MobileNet } from "./MobileNet";
import { SimpleCNN } from "./SimpleCNN";
import { logger } from "utils/logUtils";
import { recursiveAssign } from "utils/objectUtils";
import { ModelTask } from "../enums";
import { UploadedClassifier } from "./UploadedClassifier";

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
  public addModel(model: SequentialClassifier) {
    this._availableClassificationModels[model.name] = model;
  }

  public removeModel(modelName: string) {
    const model = this.availableClassificationModels[modelName];
    model.dispose();
    delete this.availableClassificationModels[modelName];
  }
  public async unzipModels(zip: JSZip) {
    const modelFileRegEx = new RegExp(".json$|.weights.bin$");
    const models: Record<
      string,
      {
        modelJson?: File;
        modelWeights?: File;
      }
    > = {};
    const failedModels: Record<string, { reason: string; err?: Error }> = {};

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
        const model = new UploadedClassifier({
          descFile: modelJson,
          weightsFiles: [modelWeights],
          name: modelName,
          task: ModelTask.Classification,
          graph: false,
          pretrained: true,
          trainable: true,
        });

        try {
          await model.upload();
          classifierHandler.addModel(model);
        } catch (err) {
          failedModels[modelName] = {
            reason: "Model upload failed",
            err: err as Error,
          };
          continue;
        }
      }
    }
  }
}

const classifierHandler = new ClassifierHandler();
export default classifierHandler;
