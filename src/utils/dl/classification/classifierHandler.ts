import JSZip from "jszip";

import type { Category } from "store/dataV2/types";

import { logger, parseError } from "utils/logUtils";
import { recursiveAssign } from "utils/objectUtils";
import { getUniqueName } from "utils/stringUtils";
import type { RequireOnly } from "utils/types";

import { RemoteClassifier, UploadedClassifier } from "./UploadedClassifier";
import { MobileNet } from "./MobileNet";
import { SimpleCNN } from "./SimpleCNN";
import { ModelTask } from "../enums";
import { ModelArch } from "./types";

import type {
  FitOptions,
  OptimizerSettings,
  PreprocessSettings,
  TrainAndEvalResult,
  TrainingCallbacks,
} from "./types";
import type { Logs } from "@tensorflow/tfjs";
import type { SequentialClassifier } from "./AbstractClassifier";
import type {
  ExtractedModelFileMap,
  InferenceInput,
  SerializedModels,
  TrainingInput,
} from "../types";

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

  public get availableClassificationModels() {
    return this._availableClassificationModels;
  }
  public getModel(modelName: string) {
    return this._availableClassificationModels[modelName];
  }

  public getModelNames() {
    return Object.keys(this._availableClassificationModels);
  }
  async createNewModel(
    modelName: string,
    architecture: ModelArch,
    seed: number,
  ): Promise<SequentialClassifier> {
    modelName = getUniqueName(modelName, this.getModelNames());
    try {
      let model: SequentialClassifier;
      if (architecture === ModelArch.SIMPLE_CNN)
        model = new SimpleCNN(modelName, seed);
      else model = new MobileNet(modelName);
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

  private resolveModel(modelName: string): SequentialClassifier {
    const model = this._availableClassificationModels[modelName];
    if (!model) {
      throw new Error(
        `ClassifierHandler: no model registered with name "${modelName}"`,
      );
    }
    return model;
  }

  public loadTraining(
    modelName: string,
    items: TrainingInput[],
    categories: RequireOnly<Category, "id">[],
    runSeed: number,
  ) {
    this.resolveModel(modelName).loadTraining(items, categories, runSeed);
  }

  public loadValidation(
    modelName: string,
    items: TrainingInput[],
    categories: RequireOnly<Category, "id">[],
    runSeed: number,
  ) {
    this.resolveModel(modelName).loadValidation(items, categories, runSeed);
  }
  public loadInference(
    modelName: string,
    items: InferenceInput[],
    categories: RequireOnly<Category, "id">[],
  ) {
    this.resolveModel(modelName).loadInference(items, categories);
  }

  public loadData(
    modelName: string,
    trainingData: TrainingInput[],
    validationData: TrainingInput[],
    categories: RequireOnly<Category, "id">[],
    runSeed: number,
  ) {
    const model = this.resolveModel(modelName);
    model.loadTraining(trainingData, categories, runSeed);
    model.loadValidation(validationData, categories, runSeed);
  }
  public async prepareModel(
    modelName: string,
    trainingData: TrainingInput[],
    validationData: TrainingInput[],
    numClasses: number,
    categories: Category[],
    preprocessSettings: PreprocessSettings,
    optimizerSettings: OptimizerSettings,
    runSeed: number,
  ) {
    const model = this.resolveModel(modelName);

    /* LOAD CLASSIFIER MODEL */
    try {
      if (model instanceof SimpleCNN) {
        (model as SimpleCNN).loadModel({
          inputShape: preprocessSettings.inputShape,
          numClasses,
          compileOptions: optimizerSettings,
          preprocessOptions: preprocessSettings,
        });
      } else if (model instanceof MobileNet) {
        await (model as MobileNet).loadModel({
          inputShape: preprocessSettings.inputShape,
          numClasses,
          compileOptions: optimizerSettings,
          preprocessOptions: preprocessSettings,
          freeze: false,
          useCustomTopLayer: true,
        });
      } else {
        import.meta.env.NODE_ENV !== "production" &&
          import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
          console.warn("Unhandled architecture", model.name);
        return;
      }
    } catch (error) {
      throw new Error("Failed to create tensorflow model", {
        cause: error as Error,
      });
    }
    try {
      model.classes = categories.map((cat) => cat.name);
      model.loadTraining(trainingData, categories, runSeed);
      model.loadValidation(validationData, categories, runSeed);
    } catch (error) {
      throw new Error("Error in preprocessing", { cause: error as Error });
    }
  }

  public async train(
    modelName: string,
    options: FitOptions,
    callbacks: TrainingCallbacks = {
      onEpochEnd: async (epoch: number, logs?: Logs) => {
        logger(`Epcoch: ${epoch}`);
        logger(logs);
      },
    },
  ): Promise<TrainAndEvalResult> {
    const model = this.resolveModel(modelName);
    const trainingResults = await model.train(options, callbacks);
    import.meta.env.NODE_ENV !== "production" &&
      import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
      logger(model.currentFitHistory);

    /*
     * Until runs get properly snapshotted, evaluate after each run
     */
    const evalResults = await model.evaluate();

    return { ...trainingResults, evalResults };
  }

  public async predict(
    modelName: string,
    categories: RequireOnly<Category, "id">[],
  ) {
    return this.resolveModel(modelName).predict(categories);
  }

  public async evaluate(modelName: string) {
    return this.resolveModel(modelName).evaluate();
  }
  public async modelFromFiles(input: {
    descFile: File;
    weightsFiles: File[];
    isGraph?: boolean;
    modelName?: string;
  }): Promise<
    | { success: true; model: SequentialClassifier }
    | {
        success: false;
        modelName: string;
        error: { reason: string; err?: Error };
      }
  > {
    const modelName =
      input.modelName ?? input.descFile.name.replace(/\..+$/, "");
    const uniqueName = getUniqueName(modelName, this.getModelNames());

    const model = new UploadedClassifier({
      descFile: input.descFile,
      weightsFiles: input.weightsFiles,
      name: uniqueName,
      task: ModelTask.Classification,
      graph: !!input.isGraph,
      pretrained: true,
      trainable: true,
    });
    try {
      await model.upload();
      return { success: true, model };
    } catch (err) {
      return {
        success: false,
        modelName,
        error: { reason: "Failed to upload model", err: parseError(err) },
      };
    }
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

  public async extractModelsFromZip(
    zip: JSZip,
  ): Promise<ExtractedModelFileMap> {
    const modelFileRegEx = new RegExp(".json$|.weights.bin$");
    const models: ExtractedModelFileMap = {};
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
    return models;
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
        const result = await this.modelFromFiles({
          descFile: modelJson,
          weightsFiles: [modelWeights],
        });
        if (result.success) {
          loadedModels.push(result.model);
        } else {
          failedModels[result.modelName] = result.error;
        }
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
