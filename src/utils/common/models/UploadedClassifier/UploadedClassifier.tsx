import { CompileOptions, Shape } from "types";
import { SequentialClassifier } from "../AbstractClassifier/AbstractClassifier";
import { Model } from "../Model";
import { io, loadGraphModel, loadLayersModel } from "@tensorflow/tfjs";

type LoadModelArgs = {
  inputShape: Shape;
  numClasses: number;
  compileOptions: CompileOptions;
  randomizeWeights: boolean;
  uploadOnly?: boolean;
};

enum LoadState {
  Unloaded,
  Uploaded,
  Loaded,
}

export class UploadedClassifier extends SequentialClassifier {
  readonly TFHub: boolean;
  protected _ioHandler?: ReturnType<typeof io.browserFiles>;
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
    descFile, // Model description json file
    weightsFiles, // Model weights bin files
    ...modelArgs
  }: {
    TFHub: boolean;
    descFile?: File;
    weightsFiles?: Array<File>;
  } & ConstructorParameters<typeof Model>[0]) {
    super(modelArgs);

    this._loadState = LoadState.Unloaded;

    this.TFHub = TFHub;

    if (descFile && weightsFiles) {
      this._ioHandler = io.browserFiles([descFile, ...weightsFiles]);
    } else if (descFile) {
      throw Error("No weights files (.bin) provided");
    } else if (weightsFiles) {
      throw Error("No description file (.json) provided");
    }

    if (this.TFHub && !this.src) {
      throw Error("A TFHub url was not provided");
    }

    if ((this.TFHub || this.src) && this._ioHandler) {
      throw Error(
        "A model cannot have both a url source and uploaded model files"
      );
    }
  }

  async upload(): Promise<void> {
    if (this.src && this.TFHub && !Model.verifyTFHubUrl(this.src)) {
      throw new Error(`Expected TFHub Url: ${this.src}`);
    }

    if (this.src && this.graph) {
      this._model = await loadGraphModel(this.src, {
        fromTFHub: this.TFHub,
      });
    } else if (this.src) {
      this._model = await loadLayersModel(this.src, {
        fromTFHub: this.TFHub,
      });
    } else if (this._ioHandler && this.graph) {
      this._model = await loadGraphModel(this._ioHandler);
    } else if (this._ioHandler) {
      this._model = await loadLayersModel(this._ioHandler);
    } else {
      throw Error("Could not load model, no source available");
    }

    this._loadState = LoadState.Uploaded;
  }

  async loadModel({
    inputShape,
    numClasses,
    compileOptions,
    randomizeWeights,
  }: LoadModelArgs) {
    if (this._loadState === LoadState.Unloaded) {
      await this.upload();
    }

    this._loadState = LoadState.Loaded;
  }
}
