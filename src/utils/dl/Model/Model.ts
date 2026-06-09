import { io } from "@tensorflow/tfjs";

import {
  MODEL_JSON_FILENAME,
  MODEL_WEIGHTS_FILENAME,
} from "utils/file-io-v2/consts";

import type {
  RunHistoryEpoch,
  ModelArgs,
  OptimizerSettings,
  ReducedPreprocessSettings,
  ModelArch,
} from "../classification/types";
import type { ModelTask } from "../enums";
import type { GraphModel, LayersModel } from "@tensorflow/tfjs";

export class Model {
  readonly name: string;
  readonly task: ModelTask;
  readonly graph: boolean;
  readonly trainable: boolean;
  readonly kind?: string | Array<string>;
  readonly src?: string;

  private _requiredChannels?: number;
  private _pretrained: boolean;

  protected _model?: LayersModel | GraphModel;
  protected _currentFitHistory: RunHistoryEpoch[];
  protected _preprocessingSettings?: ReducedPreprocessSettings;
  protected _classes?: string[];
  protected _optimizerSettings?: OptimizerSettings;
  protected _modelArch?: ModelArch;

  constructor({
    name,
    task,
    kind,
    graph,
    pretrained,
    trainable,
    src,
    requiredChannels,
    modelArch,
  }: ModelArgs) {
    this.name = name;
    this.task = task;
    this.kind = kind;
    this.graph = graph;
    this._pretrained = pretrained;
    this.trainable = trainable;
    this.src = src;
    this._requiredChannels = requiredChannels;
    this._modelArch = modelArch;
    // set defaults
    this._model = undefined;
    this._currentFitHistory = [];
  }

  public dispose() {
    if (this._model) {
      this._model.dispose();
    }
    // set defaults
    this._model = undefined;
    this._currentFitHistory = [];
  }

  public get requiredChannels() {
    return this._requiredChannels;
  }
  public get numEpochs() {
    return this._currentFitHistory.length;
  }

  public get currentFitEpochCount() {
    return this._currentFitHistory.length;
  }

  public get currentFitHistory(): RunHistoryEpoch[] {
    return this._currentFitHistory;
  }

  public get pretrained() {
    return this._pretrained;
  }

  public get preprocessingSettings() {
    return this._preprocessingSettings;
  }
  public get optimizerSettings() {
    return this._optimizerSettings;
  }
  public get modelArch() {
    return this._modelArch;
  }

  public setPretrained() {
    this._pretrained = true;
  }

  public async getSavedModelFiles() {
    let weightsBlob: Blob | undefined = undefined;
    let modelJsonBlob: Blob | undefined = undefined;

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
            paths: ["./" + MODEL_WEIGHTS_FILENAME],
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
          preprocessSettings?: ReducedPreprocessSettings;
          classes?: string[];
          optimizerSettings?: OptimizerSettings;
          modelArch?: ModelArch;
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
        if (this._preprocessingSettings) {
          modelJSON.preprocessSettings = this._preprocessingSettings;
        }
        if (this._classes) {
          modelJSON.classes = this._classes;
        }
        if (this._optimizerSettings) {
          modelJSON.optimizerSettings = this._optimizerSettings;
        }
        if (this._modelArch !== undefined) {
          modelJSON.modelArch = this._modelArch;
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
      weightsFileName: MODEL_WEIGHTS_FILENAME,
      modelJsonFileName: MODEL_JSON_FILENAME,
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
  public get defaultInputShape() {
    return this._model?.inputs[0].shape!.slice(1) as number[];
  }
  public get modelLoaded() {
    return this._model !== undefined;
  }
}
