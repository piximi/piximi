import { tidy, zeros } from "@tensorflow/tfjs";

import { logger } from "utils/logUtils";
import type { LoadCB } from "utils/types";
import type { InferenceInput } from "utils/dl/types";
import type { Token } from "utils/dl/cancel";

import { Model } from "../../../Model";

import type { SegmentationResults } from "../../types";
import type { GraphModel, Tensor } from "@tensorflow/tfjs";

export abstract class Segmenter extends Model {
  public override dispose() {
    super.dispose();
  }

  public abstract loadModel(): Promise<void>;
  public abstract predict(
    items: InferenceInput[],
    cancelToken: Token,
    loadCb?: LoadCB,
  ): SegmentationResults | Promise<SegmentationResults>;

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
