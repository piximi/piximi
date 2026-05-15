import {
  tidy,
  argMax,
  oneHot,
  math,
  metrics,
  zeros,
  concat,
} from "@tensorflow/tfjs";

import type { Category } from "store/dataV2/types";
import type { RunStatus } from "store/classifier/types";

import type { RequireOnly } from "utils/types";

import { preprocessData } from "./preprocess";
import { Model } from "../../Model";
import { evaluateConfusionMatrix, getLayersModelSummary } from "../../utils";

import type {
  ClassifierEvaluationResult,
  FitOptions,
  InferenceInput,
  PredictionResult,
  TrainingCallbacks,
  TrainingInput,
  TrainingResults,
} from "../../types";
import type {
  GraphModel,
  LayersModel,
  Tensor,
  Tensor1D,
  Tensor2D,
  Tensor4D,
  data as tfdata,
} from "@tensorflow/tfjs";

const isLayersModel = (
  model: LayersModel | GraphModel,
): model is LayersModel => {
  return !("modelUrl" in model);
};
export abstract class SequentialClassifier extends Model {
  protected _trainingDataset?: tfdata.Dataset<{ xs: Tensor4D; ys: Tensor2D }>;
  protected _validationDataset?: tfdata.Dataset<{ xs: Tensor4D; ys: Tensor2D }>;
  protected _inferenceDataset?: tfdata.Dataset<{ xs: Tensor4D }>;
  private _cachedOutputShape?: number[];
  protected override _classes: string[] = [];

  public override dispose() {
    this._trainingDataset = undefined;
    this._validationDataset = undefined;
    this._inferenceDataset = undefined;
    this._cachedOutputShape = undefined;
    super.dispose();
  }

  public loadTraining(
    items: TrainingInput[],
    categories: RequireOnly<Category, "id">[],
    runSeed: number,
  ) {
    if (!this._preprocessingSettings) return;
    this._trainingDataset = preprocessData({
      items,
      categories,
      preprocessOptions: this._preprocessingSettings,
      inference: false,
      seed: runSeed,
    });
  }

  public loadValidation(
    items: TrainingInput[],
    categories: RequireOnly<Category, "id">[],
    runSeed: number,
  ) {
    if (!this._preprocessingSettings) return;
    this._validationDataset = preprocessData({
      items,
      categories,
      preprocessOptions: this._preprocessingSettings,
      inference: false,
      seed: runSeed ^ 1, // Decorrelate from training PRNG stream (which also uses runSeed).
    });
  }

  public loadInference(
    items: InferenceInput[],
    categories: RequireOnly<Category, "id">[],
  ) {
    if (!this._preprocessingSettings) return;
    this._inferenceDataset = preprocessData({
      items,
      categories,
      preprocessOptions: this._preprocessingSettings,
      inference: true,
    });
  }

  public async train(
    options: FitOptions,
    callbacks: TrainingCallbacks,
  ): Promise<TrainingResults> {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }
    if (!isLayersModel(this._model))
      throw Error(`"${this.name}" Graph Model training not implemented`);

    if (!this._trainingDataset) {
      throw Error(`"${this.name}" Model's training data not loaded`);
    }

    if (!this._validationDataset) {
      throw Error(`"${this.name}" Model's validation data not loaded`);
    }

    if (!this.trainable) {
      throw Error(`"${this.name}" Model is not trainable`);
    }

    let status: RunStatus = "completed";
    try {
      await this._model.fitDataset(this._trainingDataset, {
        ...options,
        callbacks: [callbacks],
        validationData: this._validationDataset,
      });
    } catch (err) {
      status = this._model.stopTraining ? "stopped" : "failed";
      if (status === "failed") throw err;
    }

    this.setPretrained();
    return {
      weightsRef: this.name,
      status,
    };
  }

  public async predict(
    categories: Array<RequireOnly<Category, "id">>,
  ): Promise<PredictionResult> {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    if (!this._inferenceDataset) {
      throw Error(`"${this.name}" Model's inferences data not loaded`);
    }

    // ref this._model because it may go undefined during async ops
    const model = this._model;
    const allProbs: Tensor2D[] = [];
    const allCategoryIdxs: number[] = [];
    const allMaxProbs: number[] = [];
    await this._inferenceDataset!.forEachAsync(async (batch) => {
      const batchProbs = model.predict(batch.xs) as Tensor2D;
      const argmax = batchProbs.argMax(-1);
      const max = batchProbs.max(-1);
      const argmaxArr = argmax.arraySync() as number[];
      const maxArr = max.arraySync() as number[];
      allCategoryIdxs.push(...argmaxArr);
      allMaxProbs.push(...maxArr);
      allProbs.push(batchProbs);
      argmax.dispose();
      max.dispose();
    });

    const stackedProbs = concat(allProbs, 0) as Tensor2D;
    const softmaxArr = (await stackedProbs.array()) as number[][];
    allProbs.forEach((t) => t.dispose());
    stackedProbs.dispose();

    const itemPredictions = allCategoryIdxs.map((idx, i) => ({
      categoryId: categories[idx].id,
      maxProb: allMaxProbs[i],
      softmax: softmaxArr[i],
    }));

    return itemPredictions;
  }

  public async evaluate(): Promise<ClassifierEvaluationResult> {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    if (!this._validationDataset) {
      throw Error(`"${this.name}" Model's validation data not loaded`);
    }

    // ref this._model because it may go undefined during async ops
    const model = this._model;

    const numClasses = this._model.outputs[0].shape![1] as number;
    // only for Layers model
    // const numClasses = this._model.outputShape[1] as number;

    const inferredBatchTensors = await this._validationDataset
      .map((items) => {
        // probability distribution vectors - shape [batchSize, numClasses]
        const batchProbs = model.predict(items.xs) as Tensor2D;
        // predicted class index scalars - shape [batchSize]
        const batchPred = argMax(batchProbs, 1) as Tensor1D;
        // prediction one hot vector - shape [bachSize, numClasses]
        const batchPredOneHot = oneHot(batchPred, numClasses) as Tensor2D;
        // target class index scalars - shape [batchSize]
        const batchLabel = argMax(items.ys, 1) as Tensor1D;

        return {
          probs: batchProbs,
          preds: batchPred,
          predsOneHot: batchPredOneHot, // ŷs
          ys: items.ys,
          labels: batchLabel,
        };
      })
      .toArray();

    const inferredTensors = inferredBatchTensors.reduce((prev, curr) => {
      const probs = prev.probs.concat(curr.probs);
      const preds = prev.preds.concat(curr.preds);
      const predsOneHot = prev.predsOneHot.concat(curr.predsOneHot); // ŷs
      const ys = prev.ys.concat(curr.ys);
      const labels = prev.labels.concat(curr.labels);

      prev.probs.dispose();
      prev.preds.dispose();
      prev.predsOneHot.dispose();
      prev.ys.dispose();
      prev.labels.dispose();

      curr.probs.dispose();
      curr.preds.dispose();
      curr.predsOneHot.dispose();
      curr.ys.dispose();
      curr.labels.dispose();

      return {
        probs,
        preds,
        predsOneHot,
        ys,
        labels,
      };
    });

    const confusionMatrix = await math
      .confusionMatrix(
        inferredTensors.labels,
        inferredTensors.preds,
        numClasses,
      )
      .array();

    let accuracy: number[];
    let crossEntropy: number[];
    if (numClasses === 2) {
      accuracy = (await metrics
        .binaryAccuracy(inferredTensors.ys, inferredTensors.predsOneHot)
        .array()) as number[];
      crossEntropy = (await metrics
        .binaryCrossentropy(inferredTensors.ys, inferredTensors.probs as Tensor)
        .array()) as number[];
    } else {
      accuracy = (await metrics
        .categoricalAccuracy(
          inferredTensors.ys,
          inferredTensors.probs as Tensor,
        )
        .array()) as number[];
      crossEntropy = (await metrics
        .categoricalCrossentropy(
          inferredTensors.ys,
          inferredTensors.probs as Tensor,
        )
        .array()) as number[];
    }

    const { precision, recall, f1Score } = evaluateConfusionMatrix(
      numClasses,
      confusionMatrix,
    );

    inferredTensors.probs.dispose();
    inferredTensors.preds.dispose();
    inferredTensors.predsOneHot.dispose();
    inferredTensors.ys.dispose();
    inferredTensors.labels.dispose();

    return {
      confusionMatrix: confusionMatrix,
      accuracy: accuracy.reduce((a, b) => a + b) / accuracy.length,
      crossEntropy: crossEntropy.reduce((a, b) => a + b) / accuracy.length,
      precision: precision,
      recall: recall,
      f1Score: f1Score,
    };
  }

  public stopTraining(): void {
    if (!this._model) {
      throw Error("Model not loaded");
    }

    if (!isLayersModel(this._model)) {
      throw Error("Early stop not implemented for graph model");
    }

    this._model.stopTraining = true;
  }

  public get modelLoaded() {
    return this._model !== undefined;
  }

  public get numClasses() {
    return this.defaultOutputShape[0];
  }

  public set classes(classes: string[]) {
    this._classes = classes;
  }

  public get classes() {
    return this._classes!;
  }
  public get defaultInputShape() {
    return this._model?.inputs[0].shape!.slice(1) as number[];
  }

  public get defaultOutputShape() {
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
      // sometimes models don't list their output shape (often graph models)
      // in this case run inference on dummy data, and get shape of output
      // we cache it to avoid expensive recalculation

      const _outputShape = tidy(() => {
        const dummyData = zeros(this.defaultInputShape).expandDims(0);
        const pred = this._model!.predict(dummyData) as Tensor;
        return pred.shape.slice(1) as number[];
      });

      this._cachedOutputShape = _outputShape;

      return this._cachedOutputShape;
    }
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

  public get modelSummary() {
    // Called from render-time JSX (e.g. `disabled={!selectedModel?.modelSummary}`),
    // so stay silent when the model isn't compiled yet — just return undefined.
    // TODO: implement summary for graph models
    if (this.graph) return undefined;
    if (!this._model) return undefined;

    return getLayersModelSummary(this._model as LayersModel);
  }

  public onEpochEnd: TrainingCallbacks["onEpochEnd"] = async (
    _epochs,
    _logs,
  ) => {};
}
