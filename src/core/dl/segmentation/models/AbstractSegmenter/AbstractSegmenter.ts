import { io } from "@tensorflow/tfjs";

import {
  MODEL_JSON_FILENAME,
  MODEL_WEIGHTS_FILENAME,
} from "core/file-io/consts";

import type { LoadCB } from "utils/types";

import type { InferenceInput } from "core/dl/types";
import type { Token } from "core/dl/cancel";
import type { ModelName, SegmentationResults } from "../../types";
import type { GraphModel } from "@tensorflow/tfjs";

type ModelArgs = {
  name: ModelName;
  kind?: string | Array<string>;
  requiredChannels: number;
  src?: string;
};
export abstract class Segmenter {
  readonly name: ModelName;
  readonly kind?: string | Array<string>;

  private _requiredChannels: number;
  readonly src?: string;

  protected _model?: GraphModel;
  protected _classes?: string[];

  constructor({ name, kind, requiredChannels, src }: ModelArgs) {
    this.name = name;
    this.kind = kind;
    this._requiredChannels = requiredChannels;
    this.src = src;
    // set defaults
    this._model = undefined;
  }
  public dispose() {
    if (this._model) {
      this._model.dispose();
    }
    // set defaults
    this._model = undefined;
  }
  public get modelLoaded() {
    return this._model !== undefined;
  }
  public get requiredChannels() {
    return this._requiredChannels;
  }
  public abstract loadModel(): Promise<void>;
  public abstract predict(
    items: InferenceInput[],
    cancelToken: Token,
    loadCb?: LoadCB,
  ): SegmentationResults | Promise<SegmentationResults>;

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
          classes?: string[];
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
        if (this._classes) {
          modelJSON.classes = this._classes;
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
}
