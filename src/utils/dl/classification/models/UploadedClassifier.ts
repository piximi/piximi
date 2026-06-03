import { io, loadGraphModel, loadLayersModel } from "@tensorflow/tfjs";

import type { Shape, ShapeArray } from "store/data/types";

import { logger } from "utils/logUtils";
import { arrayRange } from "utils/arrayUtils";
import { validateModelMetadata } from "utils/file-io/runtime/validators";
import type { RequireOnly } from "utils/types";

import { SequentialClassifier } from "./AbstractClassifier";
import { createCompileArgs, getDefaultModelInfo } from "../utils";
import { convertArrayToShape } from "../../utils";
import { ModelArch } from "../types";

import type { Model } from "../../Model";
import type { OptimizerSettings } from "../types";
import type { LayersModel } from "@tensorflow/tfjs";
import type { CropSchema } from "../../enums";

enum LoadState {
  Unloaded,
  Uploaded,
  Loaded,
}

export class UploadedClassifier extends SequentialClassifier {
  protected _ioHandler: ReturnType<typeof io.browserFiles>;
  protected _loadState: LoadState;
  private _descFile?: File;

  /*
   * whether from src, or the descFile, the JSON file should contain 'modelTopology' and 'weightsManifest
   *
   * 'modelTopology': A JSON object that can be either of:
   *   1) a model architecture JSON consistent with the format of the return value of keras.Model.to_json()
   *   2) a full model JSON in the format of keras.models.save_model().
   *
   * 'weightsManifest': A TensorFlow.js weights manifest.
   *   See the Python converter function save_model() for more details.
   *   It is also assumed that model weights (.bin files) can be accessed
   *   from relative paths described by the paths fields in weights manifest.
   */
  constructor({
    descFile,
    weightsFiles,
    ...modelArgs
  }: {
    descFile: File;
    weightsFiles: Array<File>;
  } & ConstructorParameters<typeof Model>[0]) {
    super(modelArgs);

    this._loadState = LoadState.Unloaded;

    this._ioHandler = io.browserFiles([descFile, ...weightsFiles]);
    this._descFile = descFile;
  }

  public async upload(): Promise<void> {
    if (this.graph) {
      this._model = await loadGraphModel(this._ioHandler);
    } else {
      this._model = await loadLayersModel(this._ioHandler);
    }
    let metadata:
      | {
          preprocessSettings: {
            cropSchema: CropSchema;
            numCrops: number;
            inputShape: Omit<Shape, "planes">;
            shuffle: boolean;
            normalize: boolean;
            batchSize: number;
          };
          classes: string[];
          optimizerSettings: OptimizerSettings;
          modelArch?: ModelArch;
        }
      | undefined;
    if (this._descFile) {
      const descContents = await this._descFile.text();
      try {
        const raw = validateModelMetadata(descContents) as {
          preprocessSettings: Omit<
            (typeof metadata & {})["preprocessSettings"],
            "normalize"
          > & { rescale: boolean };
          classes: string[];
          optimizerSettings: OptimizerSettings;
          modelArch?: number;
        };
        const {
          rescale,
          normalize: normalizeField,
          ...rest
        } = raw.preprocessSettings as typeof raw.preprocessSettings & {
          normalize?: boolean;
        };
        metadata = {
          ...raw,
          preprocessSettings: { ...rest, normalize: normalizeField ?? rescale },
          modelArch:
            raw.modelArch !== undefined
              ? raw.modelArch === 0
                ? ModelArch.SIMPLE_CNN
                : ModelArch.MOBILE_NET
              : undefined,
        };
      } catch (err) {
        logger(err, { level: "warn" });
      }
    }
    if (metadata) {
      this._preprocessingSettings = metadata.preprocessSettings;
      this.classes = metadata.classes;
      this._optimizerSettings = metadata.optimizerSettings;
      this._modelArch = metadata.modelArch;
    } else {
      const defaultModelInfo = getDefaultModelInfo();
      this._preprocessingSettings = {
        inputShape: {
          ...convertArrayToShape(this.defaultInputShape as ShapeArray),
          channels: this.requiredChannels ?? this.defaultInputShape[3],
        },
        ...defaultModelInfo.preprocessSettings.cropOptions,
        shuffle: defaultModelInfo.preprocessSettings.shuffle,
        normalize:
          defaultModelInfo.preprocessSettings.normalizeOptions.normalize,
        batchSize: defaultModelInfo.optimizerSettings.batchSize,
      };
      this._optimizerSettings = defaultModelInfo.optimizerSettings;
      const modelSummary = this.modelSummary;
      if (
        modelSummary &&
        modelSummary.length > 0 &&
        modelSummary.at(-1)?.layerName.includes("dense")
      ) {
        const numClasses = modelSummary.at(-1)?.outputShape.split(",");
        if (numClasses && numClasses.length === 1) {
          if (+numClasses > 100)
            throw new Error("Unable to upload backbones at this time");
          this.classes = arrayRange(+numClasses[0]).map((i) => i.toString());
        }
      }
    }
    if (!this.graph) {
      const compileArgs = createCompileArgs(this._optimizerSettings);
      (this._model as LayersModel).compile(compileArgs);
    }
    this._loadState = LoadState.Uploaded;
  }

  public async loadModel() {
    if (this._loadState !== LoadState.Unloaded) return;

    await this.upload();

    this._loadState = LoadState.Loaded;
  }
}

export class RemoteClassifier extends SequentialClassifier {
  protected _loadState: LoadState;

  /*
   * whether from src, or the descFile, the JSON file should contain 'modelTopology' and 'weightsManifest
   *
   * 'modelTopology': A JSON object that can be either of:
   *   1) a model architecture JSON consistent with the format of the return value of keras.Model.to_json()
   *   2) a full model JSON in the format of keras.models.save_model().
   *
   * 'weightsManifest': A TensorFlow.js weights manifest.
   *   See the Python converter function save_model() for more details.
   *   It is also assumed that model weights (.bin files) can be accessed
   *   from relative paths described by the paths fields in weights manifest.
   */
  constructor({
    ...modelArgs
  }: RequireOnly<ConstructorParameters<typeof Model>[0], "src">) {
    super(modelArgs as ConstructorParameters<typeof Model>[0]);

    this._loadState = LoadState.Unloaded;
  }

  public async upload(): Promise<void> {
    if (!this.src) throw Error("Could not load model, no source available");

    if (this.graph) {
      this._model = await loadGraphModel(this.src);
    } else {
      this._model = await loadLayersModel(this.src);
    }

    this._loadState = LoadState.Uploaded;
  }

  public async loadModel() {
    if (this._loadState === LoadState.Unloaded) {
      await this.upload();
    }

    this._loadState = LoadState.Loaded;
  }
}

export class ClonedClassifier extends SequentialClassifier {
  protected _sourceModelArtifacts: io.ModelArtifacts;
  protected _loadState: LoadState;

  /*
   * whether from src, or the descFile, the JSON file should contain 'modelTopology' and 'weightsManifest
   *
   * 'modelTopology': A JSON object that can be either of:
   *   1) a model architecture JSON consistent with the format of the return value of keras.Model.to_json()
   *   2) a full model JSON in the format of keras.models.save_model().
   *
   * 'weightsManifest': A TensorFlow.js weights manifest.
   *   See the Python converter function save_model() for more details.
   *   It is also assumed that model weights (.bin files) can be accessed
   *   from relative paths described by the paths fields in weights manifest.
   */
  constructor({
    modelArtifacts,
    ...modelArgs
  }: {
    modelArtifacts: io.ModelArtifacts;
  } & ConstructorParameters<typeof Model>[0]) {
    super(modelArgs);

    this._sourceModelArtifacts = modelArtifacts;
    this._loadState = LoadState.Unloaded;
  }

  public async loadModel() {
    if (this._loadState === LoadState.Unloaded) {
      try {
        this._model = await loadLayersModel(
          io.fromMemory(
            this._sourceModelArtifacts,
            this._sourceModelArtifacts.weightSpecs,
          ),
        );
      } catch (err) {
        throw new Error("Error creating model from artifacts.", err as Error);
      }
    }

    this._loadState = LoadState.Loaded;
  }
}
