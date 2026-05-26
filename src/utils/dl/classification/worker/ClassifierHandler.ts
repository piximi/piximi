import JSZip from "jszip";

import type { Category } from "store/dataV2/types";

import { logger, parseError } from "utils/logUtils";
import { recursiveAssign } from "utils/objectUtils";
import { getUniqueName } from "utils/stringUtils";

import {
  RemoteClassifier,
  UploadedClassifier,
  MobileNet,
  SimpleCNN,
} from "../models";
import { ModelTask } from "../../enums";
import { ModelArch } from "../types";
import { err, ok } from "../utils";

import type {
  ApiResult,
  BatchModelLoadResult,
  EvaluationResult,
  FitOptions,
  IClassifierApi,
  ModelInfoDTO,
  OptimizerSettings,
  PredictionResult,
  PreprocessSettings,
  TrainAndEvalResult,
  TrainingCallbacks,
} from "../types";
import type { Logs } from "@tensorflow/tfjs";
import type { SequentialClassifier } from "../models";
import type {
  InferenceInput,
  SerializedModelData,
  SerializedModels,
  TrainingInput,
} from "../../types";

export class ClassifierHandler implements IClassifierApi {
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

  /*
   * Model Creation/Deletion
   */

  public async createNewModel(
    modelName: string,
    architecture: ModelArch,
    seed: number,
  ): Promise<ApiResult<ModelInfoDTO>> {
    const uniqueName = getUniqueName(
      modelName,
      Object.keys(this._availableClassificationModels),
    );
    try {
      const model: SequentialClassifier =
        architecture === ModelArch.SIMPLE_CNN
          ? new SimpleCNN(uniqueName, seed)
          : new MobileNet(uniqueName);
      this._availableClassificationModels[uniqueName] = model;
      return ok(this.buildModelInfoDTO(model));
    } catch (e) {
      return err("MODEL_CREATE_FAILED", "Failed to create model", e);
    }
  }

  public addModels(
    models: Record<string, SequentialClassifier> | Array<SequentialClassifier>,
  ): void {
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

  public async removeModel(modelName: string) {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );

    model.dispose();
    delete this._availableClassificationModels[modelName];
    return ok(modelName);
  }

  public async removeAllModels() {
    Object.keys(this._availableClassificationModels).forEach((modelName) => {
      const model = this._availableClassificationModels[modelName];
      model.dispose();
      delete this._availableClassificationModels[modelName];
    });
    return ok();
  }

  /*
   * Model Information Access
   */
  private resolveModel(modelName: string) {
    return this._availableClassificationModels[modelName] ?? null;
  }

  private buildModelInfoDTO(model: SequentialClassifier) {
    return {
      name: model.name,
      archTag: (model as any).archTag,
      task: model.task,
      graph: model.graph,
      trainable: model.trainable,
      pretrained: model.pretrained,
      classes: model.classes ?? [],
      numClasses: model.modelLoaded ? model.numClasses : 0,
      preprocessingSettings: model.preprocessingSettings,
      optimizerSettings: model.optimizerSettings,
      currentFitHistory: model.currentFitHistory,
      modelSummary: model.modelLoaded ? model.modelSummary : undefined,
      modelLoaded: model.modelLoaded,
      trainingLoaded: model.trainingLoaded,
      validationLoaded: model.validationLoaded,
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

  public get availableClassificationModels() {
    return Object.entries(this._availableClassificationModels).reduce(
      (models: Record<string, ModelInfoDTO>, [name, model]) => {
        models[name] = this.buildModelInfoDTO(model);
        return models;
      },
      {},
    );
  }

  public async hasModel(modelName: string) {
    return ok(modelName in this._availableClassificationModels);
  }

  public async getModelNames() {
    return ok(Object.keys(this._availableClassificationModels));
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
   * Classification Ops
   */
  public async loadTraining(
    modelName: string,
    items: TrainingInput[],
    categories: Category[],
    runSeed: number,
  ) {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );
    try {
      model.loadTraining(items, categories, runSeed);
      return ok(modelName);
    } catch (e) {
      return err("PREPROCESS_FAILED", "Failed to load training data", e);
    }
  }
  public async loadValidation(
    modelName: string,
    items: TrainingInput[],
    categories: Category[],
    runSeed: number,
  ) {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );
    try {
      model.loadValidation(items, categories, runSeed);
      return ok(modelName);
    } catch (e) {
      return err("PREPROCESS_FAILED", "Failed to load validation data", e);
    }
  }
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
  public async loadData(
    modelName: string,
    trainingData: TrainingInput[],
    validationData: TrainingInput[],
    categories: Category[],
    runSeed: number,
  ) {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );
    try {
      model.loadTraining(trainingData, categories, runSeed);
      model.loadValidation(validationData, categories, runSeed);
      return ok(modelName);
    } catch (e) {
      return err("PREPROCESS_FAILED", "Failed to load data", e);
    }
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
  ): Promise<ApiResult<void>> {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );

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
        return ok();
      }
    } catch (e) {
      return err("TF_LOAD_FAILED", "Failed to create tensorflow model", e);
    }
    try {
      model.classes = categories.map((cat) => cat.name);
      model.loadTraining(trainingData, categories, runSeed);
      model.loadValidation(validationData, categories, runSeed);
    } catch (e) {
      return err("PREPROCESS_FAILED", "Error in preprocessing", e);
    }
    return ok();
  }
  public async recompile(
    modelName: string,
    optimizerSettings: OptimizerSettings,
  ) {
    const model = this.resolveModel(modelName);
    if (!model) return err("MODEL_NOT_FOUND", `No model ${modelName}`);
    try {
      model.recompile(optimizerSettings);
      return ok(modelName);
    } catch (e) {
      return err("TF_LOAD_FAILED", "Failed to recompile model", e);
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
  ): Promise<ApiResult<TrainAndEvalResult>> {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );

    // `callbacks` arrives across the worker boundary as a Comlink remote
    // proxy. Passing it straight to TFJS breaks: TFJS duck-types
    // CustomCallbackArgs by reading hook names, and every property access
    // on a Comlink proxy returns a callable proxy — so TFJS invokes hooks
    // the main thread doesn't implement and crashes inside Comlink's
    // request handler with `undefined.apply(...)`. Re-expose only the
    // hooks declared by TrainingCallbacks via a plain object.
    const localCallbacks: TrainingCallbacks = {
      onEpochEnd: (epoch, logs) => callbacks.onEpochEnd(epoch, logs),
    };
    let trainingResults;
    try {
      trainingResults = await model.train(options, localCallbacks);
      import.meta.env.NODE_ENV !== "production" &&
        import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
        logger(model.currentFitHistory);
    } catch (e) {
      return err("TRAINING_FAILED", "Failed to train model", e);
    }

    /*
     * Until runs get properly snapshotted, evaluate after each run
     */
    let evalResults;
    try {
      evalResults = await model.evaluate();
    } catch (e) {
      return err(
        "EVALUATION_FAILED",
        "Failed to evaluate model after training",
        e,
      );
    }

    return ok({ ...trainingResults, evalResults });
  }
  public async cancelTraining(modelName: string) {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );
    model.stopTraining();
    return ok(modelName);
  }

  public async predict(
    modelName: string,
    categories: Category[],
  ): Promise<ApiResult<PredictionResult>> {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );
    try {
      const result = await model.predict(categories);
      return ok(result);
    } catch (e) {
      return err("PREDICTION_FAILED", "Failed to predict", e);
    }
  }

  public async evaluate(
    modelName: string,
  ): Promise<ApiResult<EvaluationResult>> {
    const model = this.resolveModel(modelName);
    if (!model)
      return err(
        "MODEL_NOT_FOUND",
        `No model registered with name "${modelName}"`,
      );
    try {
      const result = await model.evaluate();
      return ok(result);
    } catch (e) {
      return err("EVALUATION_FAILED", "Failed to evaluate", e);
    }
  }

  /*
   * Model File I/O
   */
  public async modelFromFiles(input: {
    descFile: File;
    weightsFiles: File[];
    isGraph?: boolean;
    modelName?: string;
  }): Promise<ApiResult<ModelInfoDTO>> {
    const baseName =
      input.modelName ?? input.descFile.name.replace(/\..+$/, "");
    const uniqueName = getUniqueName(
      baseName,
      Object.keys(this._availableClassificationModels),
    );

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
      this._availableClassificationModels[uniqueName] = model;
      return ok(this.buildModelInfoDTO(model));
    } catch (e) {
      return err("UPLOAD_FAILED", "Failed to upload model", e);
    }
  }

  public async modelFromUrl(
    modelUrl: string,
    fromTFHub: boolean,
    isGraph: boolean,
  ): Promise<ApiResult<BatchModelLoadResult>> {
    const failedModels: Record<string, { reason: string; err?: Error }> = {};
    const loadedModels: ModelInfoDTO[] = [];
    const modelName = getUniqueName(
      "Remote-Classifier",
      Object.keys(this._availableClassificationModels),
    );
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
      loadedModels.push(this.buildModelInfoDTO(model));
      this._availableClassificationModels[model.name] = model;
    } catch (e) {
      failedModels[modelName] = {
        reason: `Failed to load model: ${e}`,
        err: parseError(e),
      };
    }
    return ok({ loadedModels, failedModels });
  }

  public async modelsFromZipBuffer(
    buffer: ArrayBuffer,
  ): Promise<ApiResult<BatchModelLoadResult>> {
    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(buffer);
    } catch (e) {
      return err("INVALID_FILE_FORMAT", "Failed to parse zip buffer", e);
    }

    const modelFileRegEx = new RegExp(".json$|.weights.bin$");
    const models: Record<
      string,
      {
        modelJson?: File;
        modelWeights?: File;
      }
    > = {};
    const failedModels: Record<string, { reason: string; err?: Error }> = {};
    const loadedModels: ModelInfoDTO[] = [];

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
          loadedModels.push(result.data);
        } else {
          failedModels[modelName] = {
            reason: result.reason.message,
            err: parseError(result.reason.cause),
          };
        }
      }
    }
    return ok({ loadedModels, failedModels });
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
      this._availableClassificationModels,
    )) {
      const model = this._availableClassificationModels[modelName];
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
    return await this.removeAllModels();
  }
}
