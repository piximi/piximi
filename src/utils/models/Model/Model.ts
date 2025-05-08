import { GraphModel, History, LayersModel, Tensor, io } from "@tensorflow/tfjs";

import {
  ModelArgs,
  ModelHistory,
  ModelLayerData,
  OptimizerSettings,
} from "../types";
import { CropSchema, ModelTask } from "../enums";
import { ImageObject, Shape } from "store/data/types";

export abstract class Model {
  readonly name: string;
  readonly task: ModelTask;
  readonly graph: boolean;
  readonly trainable: boolean;
  readonly kind?: string;
  readonly src?: string;

  private _requiredChannels?: number;
  private _pretrained: boolean;

  protected _model?: LayersModel | GraphModel;
  protected _history: ModelHistory;
  protected _preprocessingOptions?: {
    cropSchema: CropSchema;
    numCrops: number;
    inputShape: Omit<Shape, "planes">;
    shuffle: boolean;
    rescale: boolean;
    batchSize: number;
  };
  protected _classes?: string[];
  protected _optimizerSettings?: OptimizerSettings;

  constructor({
    name,
    task,
    kind,
    graph,
    pretrained,
    trainable,
    src,
    requiredChannels,
  }: ModelArgs) {
    this.name = name;
    this.task = task;
    this.kind = kind;
    this.graph = graph;
    this._pretrained = pretrained;
    this.trainable = trainable;
    this.src = src;
    this._requiredChannels = requiredChannels;
    // set defaults
    this._model = undefined;
    this._history = { epochs: [], history: [] };
  }

  public dispose() {
    if (this._model) {
      this._model.dispose();
    }
    // set defaults
    this._model = undefined;
    this._history = { epochs: [], history: [] };
  }

  protected appendHistory(history: History) {
    this._history.epochs.push(...history.epoch);

    const numberOnlyHistory: ModelHistory["history"][number] = {};
    for (const key of Object.keys(history.history)) {
      const vals = history.history[key];
      const numberOnlyVals: number[] = [];
      for (const val of vals) {
        if (val instanceof Tensor) {
          const numberVal = val.arraySync() as number;
          val.dispose();
          numberOnlyVals.push(numberVal);
        } else {
          numberOnlyVals.push(val);
        }
      }
      numberOnlyHistory[key] = numberOnlyVals;
    }

    this._history.history.push(numberOnlyHistory);
  }

  public get requiredChannels() {
    return this._requiredChannels;
  }
  public get numEpochs() {
    return this._history.epochs.length;
  }

  public get numTrainingCylces() {
    return this._history.history.length;
  }

  public get history() {
    return this._history;
  }

  public get pretrained() {
    return this._pretrained;
  }

  public get preprocessingOptions() {
    return this._preprocessingOptions;
  }

  public setPretrained() {
    this._pretrained = true;
  }

  public abstract loadModel(loadModelArgs?: any): void | Promise<void>;
  public abstract loadTraining(
    images: ImageObject[],
    preprocessingArgs: any,
  ): void;
  public abstract loadValidation(
    images: ImageObject[],
    preprocessingArgs: any,
  ): void;
  public abstract loadInference(
    images: ImageObject[],
    preprocessingArgs: any,
  ): void;

  public abstract train(options: any, callbacks: any): Promise<History>;
  public abstract predict(options: any, callbacks: any): any;
  public abstract evaluate(): any;

  public abstract stopTraining(): void;

  public async getSavedModelFiles() {
    let weightsBlob: Blob | undefined = undefined;
    let modelJsonBlob: Blob | undefined = undefined;
    const weightsFileName = this.name + ".weights.bin";
    const modelJsonFileName = this.name + ".json";
    const saveHandler = async (modelArtifacts: io.ModelArtifacts) => {
      weightsBlob = new Blob([modelArtifacts.weightData!], {
        type: "application/octet-stream",
      });
      if (modelArtifacts.modelTopology instanceof ArrayBuffer) {
        throw new Error(
          "BrowserDownloads.save() does not support saving model topology " +
            "in binary formats yet.",
        );
      } else {
        const weightsManifest = [
          {
            paths: ["./" + weightsFileName],
            weights: modelArtifacts.weightSpecs,
          },
        ];
        const modelJSON: {
          modelTopology: typeof modelArtifacts.modelTopology;
          format: typeof modelArtifacts.format;
          generatedBy: typeof modelArtifacts.generatedBy;
          convertedBy: typeof modelArtifacts.convertedBy;
          weightsManifest: typeof weightsManifest;
          signature?: typeof modelArtifacts.signature;
          userDefinedMetadata?: typeof modelArtifacts.userDefinedMetadata;
          modelInitializer?: typeof modelArtifacts.modelInitializer;
          initializerSignature?: typeof modelArtifacts.initializerSignature;
          trainingConfig?: typeof modelArtifacts.trainingConfig;
          preprocessSettings?: {
            cropSchema: CropSchema;
            numCrops: number;
            inputShape: Omit<Shape, "planes">;
            shuffle: boolean;
            rescale: boolean;
            batchSize: number;
          };
          classes?: string[];
          optimizerSettings?: OptimizerSettings;
        } = {
          modelTopology: modelArtifacts.modelTopology,
          format: modelArtifacts.format,
          generatedBy: modelArtifacts.generatedBy,
          convertedBy: modelArtifacts.convertedBy,
          weightsManifest: weightsManifest,
        };
        if (modelArtifacts.signature != null) {
          modelJSON.signature = modelArtifacts.signature;
        }
        if (modelArtifacts.userDefinedMetadata != null) {
          modelJSON.userDefinedMetadata = modelArtifacts.userDefinedMetadata;
        }
        if (modelArtifacts.modelInitializer != null) {
          modelJSON.modelInitializer = modelArtifacts.modelInitializer;
        }
        if (modelArtifacts.initializerSignature != null) {
          modelJSON.initializerSignature = modelArtifacts.initializerSignature;
        }
        if (modelArtifacts.trainingConfig != null) {
          modelJSON.trainingConfig = modelArtifacts.trainingConfig;
        }
        if (this._preprocessingOptions) {
          modelJSON.preprocessSettings = this._preprocessingOptions;
        }
        if (this._classes) {
          modelJSON.classes = this._classes;
        }
        if (this._optimizerSettings) {
          modelJSON.optimizerSettings = this._optimizerSettings;
        }
        modelJsonBlob = new Blob([JSON.stringify(modelJSON)], {
          type: "application/json",
        });

        return {
          modelArtifactsInfo: io.getModelArtifactsInfoForJSON(modelArtifacts),
          modelJsonBlob,
          weightsBlob,
        };
      }
    };
    if (!this._model) throw Error(`Model ${this.name} not loaded`);
    const output = (await this._model.save(
      io.withSaveHandler(saveHandler),
    )) as {
      modelArtifactsInfo: io.ModelArtifactsInfo;
      modelJsonBlob: Blob;
      weightsBlob: Blob;
    };
    return {
      weightsBlob: output.weightsBlob,
      modelJsonBlob: output.modelJsonBlob,
      weightsFileName,
      modelJsonFileName,
    };
  }
  public async saveModel() {
    if (!this._model) throw Error(`Model ${this.name} not loaded`);

    await this._model.save(`downloads://${this.name}`);
  }

  public async getModelArtifacts() {
    if (!this._model) throw Error(`Model ${this.name} not loaded`);
    try {
      const returnArtifactsHandler = async (artifacts: io.ModelArtifacts) => ({
        modelArtifactsInfo: io.getModelArtifactsInfoForJSON(artifacts),
        artifacts,
      });
      const { artifacts } = (await this._model.save(
        io.withSaveHandler(returnArtifactsHandler),
      )) as {
        modelArtifactsInfo: io.ModelArtifactsInfo;
        artifacts: io.ModelArtifacts;
      };
      return artifacts;
    } catch (err) {
      throw new Error(
        `Could not get artifacts for model: ${this.name}.`,
        err as Error,
      );
    }
  }

  public abstract get modelLoaded(): boolean;
  public abstract get trainingLoaded(): boolean;
  public abstract get validationLoaded(): boolean;
  public abstract get inferenceLoaded(): boolean;

  public abstract get defaultInputShape(): number[];
  public abstract get defaultOutputShape(): number[] | undefined;

  public abstract get modelSummary(): Array<ModelLayerData> | undefined;

  //abstract onEpochEnd: TrainingCallbacks["onEpochEnd"];

  public static verifyTFHubUrl(url: string) {
    return url.includes("tfhub.dev");
  }
}
