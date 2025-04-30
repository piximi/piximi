import { io, loadGraphModel, loadLayersModel } from "@tensorflow/tfjs";

import { Model } from "../Model";
import { SequentialClassifier } from "./AbstractClassifier";
import { RequireOnly } from "utils/common/types";
import { CropSchema } from "../enums";
import { Shape, ShapeArray } from "store/data/types";
import { getDefaultModelInfo } from "../availableClassificationModels";
import { arrayRange, convertArrayToShape, logger } from "utils/common/helpers";
import { validateModelMetadata } from "utils/file-io/runtimeTypes";

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
            rescale: boolean;
            batchSize: number;
          };
          classes: string[];
        }
      | undefined;
    if (this._descFile) {
      console.log("here");
      const descContents = await this._descFile.text();
      try {
        metadata = validateModelMetadata(descContents);
      } catch (err) {
        logger(err, { level: "warn" });
      }
    }
    console.log(metadata);
    if (metadata) {
      console.log(metadata.preprocessSettings.inputShape);
      this._preprocessingOptions = metadata.preprocessSettings;
      this.classes = metadata.classes;
      const modelSummary = this.modelSummary;
    } else {
      const defaultModelInfo = getDefaultModelInfo();
      this._preprocessingOptions = {
        inputShape: {
          ...convertArrayToShape(this.defaultInputShape as ShapeArray),
          channels: this.requiredChannels ?? this.defaultInputShape[3],
        },
        ...defaultModelInfo.preprocessSettings.cropOptions,
        shuffle: defaultModelInfo.preprocessSettings.shuffle,
        rescale: defaultModelInfo.preprocessSettings.rescaleOptions.rescale,
        batchSize: defaultModelInfo.optimizerSettings.batchSize,
      };
      const modelSummary = this.modelSummary;
      if (
        modelSummary &&
        modelSummary.length > 0 &&
        modelSummary.at(-1)?.layerName.includes("dense")
      ) {
        const numClasses = modelSummary.at(-1)?.outputShape.split(",");
        if (numClasses && numClasses.length === 1) {
          this.classes = arrayRange(+numClasses[0]).map((i) => i.toString());
        }
      }
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
  readonly TFHub: boolean;
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
    TFHub,
    ...modelArgs
  }: {
    TFHub: boolean;
  } & RequireOnly<ConstructorParameters<typeof Model>[0], "src">) {
    super(modelArgs as ConstructorParameters<typeof Model>[0]);

    this._loadState = LoadState.Unloaded;

    this.TFHub = TFHub;
  }

  public async upload(): Promise<void> {
    if (!this.src) throw Error("Could not load model, no source available");
    if (this.src && this.TFHub && !Model.verifyTFHubUrl(this.src)) {
      throw new Error(`Expected TFHub Url: ${this.src}`);
    }

    if (this.graph) {
      this._model = await loadGraphModel(this.src, {
        fromTFHub: this.TFHub,
      });
    } else {
      this._model = await loadLayersModel(this.src, {
        fromTFHub: this.TFHub,
      });
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
