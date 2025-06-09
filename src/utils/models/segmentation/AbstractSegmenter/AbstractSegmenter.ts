import { Model } from "../../Model";
import {
  GraphModel,
  Tensor,
  Tensor2D,
  Tensor4D,
  data as tfdata,
  tidy,
  zeros,
} from "@tensorflow/tfjs";
import { TrainingCallbacks } from "../../types";
import { Category, Kind, AnnotationObject } from "store/data/types";
import { logger } from "utils/logUtils";
import { LoadCB } from "utils/file-io/types";

export type OrphanedAnnotationObject = Omit<
  AnnotationObject,
  "imageId" | "data" | "src" | "bitDepth" | "name" | "shape"
>;

export abstract class Segmenter extends Model {
  protected _trainingDataset?: tfdata.Dataset<{ xs: Tensor4D; ys: Tensor2D }>;
  protected _validationDataset?: tfdata.Dataset<{ xs: Tensor4D; ys: Tensor2D }>;
  protected _inferenceDataset?: tfdata.Dataset<Tensor4D>;

  public override dispose() {
    this._trainingDataset = undefined;
    this._validationDataset = undefined;
    this._inferenceDataset = undefined;
    super.dispose();
  }

  public abstract predict(
    loadCb?: LoadCB,
  ): OrphanedAnnotationObject[][] | Promise<OrphanedAnnotationObject[][]>;

  /*
   * Concrete classes must keep track of their inference categories somehow,
   * either taken in as an argument in `preprocessingArgs` of `loadInference`
   * or default categroies (if pretrained)
   * or both (eg take an optional arg otherwise fallback to default)
   *
   * `inferenceCategoriesById` takes a list of category ids (usually the ones
   * associated with categoryIds in the annotations returned by `predict`), and
   * returns the corresponding `Category` objects.
   */
  public abstract inferenceCategoriesById(catIds: Array<string>): Category[];
  public abstract inferenceKindsById(kind: Array<string>): Kind[];

  public evaluate() {
    throw Error(`"${this.name}" Model evaluation not supported`);
  }

  public stopTraining() {
    throw Error(`"${this.name}" Model early stopping not supported`);
  }

  public get modelLoaded() {
    return this._model !== undefined;
  }

  public get defaultInputShape() {
    return this._model?.inputs[0].shape!.slice(1) as number[];
  }

  public get expectedType() {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    return this._model.inputs[0].dtype;
  }

  public get defaultOutputShape() {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    let outputShape = this._model.outputs[0].shape;

    // if that failed, and we have a graph, check the model signature
    if (outputShape === undefined && this.graph) {
      outputShape = // @ts-ignore TFJS doesn't expose these types
        this._model.modelSignature?.outputs?.output?.tensorShape?.dim?.map(
          (dimShapeObj: any) => parseInt(dimShapeObj.size),
        );
    }

    // idx 0 is the batch dim
    return outputShape ? (outputShape as number[]).slice(1) : undefined;
  }

  public get trainingLoaded() {
    return this._trainingDataset !== undefined;
  }

  public get validationLoaded() {
    return this._validationDataset !== undefined;
  }

  public get inferenceLoaded() {
    return this._inferenceDataset !== undefined;
  }

  public onEpochEnd: TrainingCallbacks["onEpochEnd"] = async (
    _epochs,
    _logs,
  ) => {};

  public get modelSummary() {
    // TODO: implement graph model summary
    if (this.graph) throw Error("Not implemented for graph models");
    return [];
  }

  /*
   * This is for testing/debugging purposes
   * impossible to generalize completely, so shouldn't be used in code to
   * deduce exact output shape
   */
  public async predictPrintOutputShape() {
    // some models may not expose output shape at all,
    // in this case run inference on dummy data, and get shape of output
    // we cache it to avoid expensive recalculation

    // replace -1 values (e.g. variable H and W) with some positive value
    const dummyValue = 256;
    const inputShape = this.defaultInputShape;
    const variableDimIdxs: number[] = [];
    for (const [idx, dimSize] of inputShape.entries()) {
      if (dimSize === -1) {
        variableDimIdxs.push(idx);
        inputShape[idx] = dummyValue;
      }
    }

    // add a batch dimension
    const dummyShape = [1, inputShape].flat();

    const dummyData = tidy(() => zeros(dummyShape).asType(this.expectedType));

    let preds: Tensor | Tensor[];
    if (this.graph) {
      preds = await (this._model! as GraphModel).executeAsync(dummyData);
    } else {
      preds = this._model!.predict(dummyData) as Tensor;
    }

    dummyData.dispose();

    const _outputShapes: number[][] = [];

    if (!(preds instanceof Array)) {
      preds = [preds];
    }

    for (const predT of preds) {
      _outputShapes.push(predT.shape.slice(1));
      predT.dispose();
    }

    logger(
      `Output Shape(s) are ${_outputShapes}, after replacing input dims ${variableDimIdxs} (excluding batch dims)`,
    );
  }
}
