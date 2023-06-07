import { AnnotationType } from "types";
import { Model, TrainingCallbacks } from "../Model";
import {
  GraphModel,
  History,
  LayersModel,
  Tensor,
  Tensor2D,
  Tensor4D,
  data as tfdata,
  tidy,
  zeros,
} from "@tensorflow/tfjs";

export abstract class Segmenter extends Model {
  // TODO - segmenter: use protected once all the other _model accessors are refactored
  _model?: LayersModel | GraphModel;
  //protected _model?: LayersModel;
  _trainingDataset?: tfdata.Dataset<{ xs: Tensor4D; ys: Tensor2D }>;
  //protected _trainingDataset?: tfdata.Dataset<{ xs: Tensor4D; ys: Tensor2D }>;
  _validationDataset?: tfdata.Dataset<{ xs: Tensor4D; ys: Tensor2D }>;
  //protected _validationDataset?: tfdata.Dataset<{ xs: Tensor4D; ys: Tensor2D }>;
  _inferenceDataset?: tfdata.Dataset<Tensor4D>;
  // protected _inferenceDataset?: tfdata.Dataset<Tensor4D>;
  _history?: History;
  //protected _history?: History;
  private _cachedOutputShape?: number[];

  abstract predict(): AnnotationType[][] | Promise<AnnotationType[][]>;

  dispose() {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }
    this._model.dispose();
  }

  get modelLoaded() {
    return this._model !== undefined;
  }

  get defaultInputShape() {
    return this._model?.inputs[0].shape!.slice(1) as number[];
  }

  get defaultOutputShape() {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    const outputShape = this._model.outputs[0].shape;

    if (outputShape) {
      // idx 0 is the batch dim
      return (outputShape as number[]).slice(1);
    } else if (this._cachedOutputShape) {
      return this._cachedOutputShape;
    } else {
      // TODO - segmenter: may or may not be necessary, at least Stardist graph has
      // signature.outputs.output.tensorShape.dim which is not undefined even though
      // outpus[0].shape is undefined

      // sometimes models don't list their output shape (often graph models)
      // in this case run inference on dummy data, and get shape of output
      // we cache it to avoid expensive recalculation

      // add a batch dimension
      const dummyShape = [1, this.defaultInputShape].flat();

      const _outputShape = tidy(() => {
        const dummyData = zeros(dummyShape);
        const pred = this._model!.predict(dummyData) as Tensor;
        return pred.shape.slice(1) as number[];
      });

      this._cachedOutputShape = _outputShape;

      return this._cachedOutputShape;
    }
  }

  get trainingLoaded() {
    return this._trainingDataset !== undefined;
  }

  get validationLoaded() {
    return this._validationDataset !== undefined;
  }

  get inferenceLoaded() {
    return this._inferenceDataset !== undefined;
  }

  onEpochEnd: TrainingCallbacks["onEpochEnd"] = async (epochs, logs) => {};
}
