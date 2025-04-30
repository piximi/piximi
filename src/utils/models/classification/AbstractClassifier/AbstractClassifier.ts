import {
  LayersModel,
  Tensor,
  Tensor1D,
  Tensor2D,
  Tensor4D,
  data as tfdata,
  History,
  tidy,
  argMax,
  max,
  oneHot,
  math,
  metrics,
  zeros,
} from "@tensorflow/tfjs";

import { preprocessData } from "./preprocess";
import { Model } from "../../Model";

import {
  ClassifierEvaluationResultType,
  FitOptions,
  TrainingCallbacks,
} from "../../types";
import { evaluateConfusionMatrix, getLayersModelSummary } from "../../helpers";
import { Category, Thing } from "store/data/types";
import { logger } from "utils/common/helpers";
import { RequireOnly } from "utils/common/types";

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

  public loadTraining<T extends Thing>(
    images: T[],
    categories: RequireOnly<Category, "id">[],
  ) {
    if (!this._preprocessingOptions) return;
    this._trainingDataset = preprocessData({
      images,
      categories,
      preprocessOptions: this._preprocessingOptions,
      inference: false,
    });
  }

  public loadValidation<T extends Thing>(
    images: T[],
    categories: RequireOnly<Category, "id">[],
  ) {
    if (!this._preprocessingOptions) return;
    this._validationDataset = preprocessData({
      images,
      categories,
      preprocessOptions: this._preprocessingOptions,
      inference: false,
    });
  }

  public loadInference<T extends Thing>(
    images: T[],
    categories: RequireOnly<Category, "id">[],
  ) {
    if (!this._preprocessingOptions) return;
    this._inferenceDataset = preprocessData({
      images,
      categories,
      preprocessOptions: this._preprocessingOptions,
      inference: true,
    });
  }

  public async train(
    options: FitOptions,
    callbacks: TrainingCallbacks,
  ): Promise<History> {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    if (!this._trainingDataset) {
      throw Error(`"${this.name}" Model's training data not loaded`);
    }

    if (!this._validationDataset) {
      throw Error(`"${this.name}" Model's validation data not loaded`);
    }

    if (!this.trainable) {
      throw Error(`"${this.name}" Model is not trainable`);
    }

    if (!this.graph) {
      const args = {
        callbacks: [callbacks],
        epochs: options.epochs,
        validationData: this._validationDataset,
      };
      const history = await (this._model as LayersModel).fitDataset(
        this._trainingDataset,
        args,
      );
      this.appendHistory(history);
      this.setPretrained();
      return history;
    } else {
      throw Error(`"${this.name}" Graph Model training not implemented`);
    }
  }

  public async predict(
    categories: Array<RequireOnly<Category, "id">>,
  ): Promise<{ categoryIds: string[]; probabilities: number[] }> {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }

    if (!this._inferenceDataset) {
      throw Error(`"${this.name}" Model's inferences data not loaded`);
    }

    // ref this._model because it may go undefined during async ops
    const model = this._model;

    const inferredBatchTensors = await this._inferenceDataset
      .map((items) => {
        const batchProbs = model.predict(items.xs) as Tensor2D;
        const batchPred = argMax(batchProbs, 1) as Tensor1D;
        const batchMaxProb = max(batchProbs, 1) as Tensor1D;
        batchProbs.dispose();

        return {
          preds: batchPred,
          probs: batchMaxProb,
        };
      })
      .toArray();

    const inferredTensors = inferredBatchTensors.reduce((prev, curr) => {
      const predRes = prev.preds.concat(curr.preds);
      const probRes = prev.probs.concat(curr.probs);
      prev.preds.dispose();
      prev.probs.dispose();
      curr.preds.dispose();
      curr.probs.dispose();

      return {
        preds: predRes,
        probs: probRes,
      };
    });

    const predictions = await inferredTensors.preds.array();
    const probabilities = await inferredTensors.probs.array();
    const categoryIds = predictions.map((idx) => categories[idx].id);

    inferredTensors.preds.dispose();
    inferredTensors.probs.dispose();

    return { categoryIds, probabilities };
  }

  public async evaluate(): Promise<ClassifierEvaluationResultType> {
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

    if (this.graph) {
      throw Error("Early stop not implemented for graph model");
    }

    (this._model as LayersModel).stopTraining = true;
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
    // TODO: implent summary for graph models
    if (this.graph) {
      logger("Graph model summaries unavailale", { level: "warn" });
      return;
    }

    if (!this._model) {
      logger(`Model ${this.name} is not loaded`, { level: "warn" });
      return;
    }

    return getLayersModelSummary(this._model as LayersModel);
  }

  public onEpochEnd: TrainingCallbacks["onEpochEnd"] = async (
    _epochs,
    _logs,
  ) => {};
}
