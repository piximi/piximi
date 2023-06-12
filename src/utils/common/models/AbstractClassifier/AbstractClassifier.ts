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
  oneHot,
  math,
  metrics,
  zeros,
} from "@tensorflow/tfjs";

import { preprocessClassifier } from "./preprocess";
import { Model, TrainingCallbacks } from "../Model";
import { evaluateConfusionMatrix } from "../utils/evaluateConfusionMatrix";

import {
  Category,
  ClassifierEvaluationResultType,
  FitOptions,
  ImageType,
  PreprocessOptions,
  Shape,
} from "types";
import { getLayersModelSummary } from "../utils/getModelSummary";

type LoadDataArgs = {
  categories: Array<Category>;
  inputShape: Shape;
  preprocessOptions: PreprocessOptions;
  fitOptions: FitOptions;
};

export abstract class SequentialClassifier extends Model {
  // TODO - segmenter: use protected once all the other _model accessors are refactored
  _trainingDataset?: tfdata.Dataset<{ xs: Tensor4D; ys: Tensor2D }>;
  //protected _trainingDataset?: tfdata.Dataset<{ xs: Tensor4D; ys: Tensor2D }>;
  _validationDataset?: tfdata.Dataset<{ xs: Tensor4D; ys: Tensor2D }>;
  //protected _validationDataset?: tfdata.Dataset<{ xs: Tensor4D; ys: Tensor2D }>;
  _inferenceDataset?: tfdata.Dataset<{ xs: Tensor4D; ys: Tensor2D }>;
  //protected _inferenceDataset?: tfdata.Dataset<{ xs: Tensor4D; ys: Tensor2D }>;
  _history?: History;
  //protected _history?: History;
  private _cachedOutputShape?: number[];

  loadTraining(images: ImageType[], preprocessingArgs: LoadDataArgs) {
    this._trainingDataset = preprocessClassifier({
      images,
      ...preprocessingArgs,
    });
  }

  loadValidation(images: ImageType[], preprocessingArgs: LoadDataArgs) {
    this._validationDataset = preprocessClassifier({
      images,
      ...preprocessingArgs,
    });
  }

  loadInference(images: ImageType[], preprocessingArgs: LoadDataArgs) {
    this._inferenceDataset = preprocessClassifier({
      images,
      ...preprocessingArgs,
    });
  }

  async train(
    options: FitOptions,
    callbacks: TrainingCallbacks
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
        args
      );

      return history;
    } else {
      throw Error(`"${this.name}" Graph Model training not implemented`);
    }
  }

  async predict(categories: Array<Category>): Promise<string[]> {
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
        const batchPred = tidy(() => {
          // we're mapping over batches already, but predict also
          // takes a batch size option which defaults at 32
          const batchProbs = model.predict(items.xs) as Tensor2D;
          return argMax(batchProbs, 1) as Tensor1D;
        });

        return {
          preds: batchPred,
        };
      })
      .toArray();

    const inferredTensors = inferredBatchTensors.reduce((prev, curr) => {
      const res = prev.preds.concat(curr.preds);

      prev.preds.dispose();
      curr.preds.dispose();

      return {
        preds: res,
      };
    });

    const predictions = await inferredTensors.preds.array();

    const categoryIds = predictions.map((idx) => categories[idx].id);

    inferredTensors.preds.dispose();

    return categoryIds;
  }

  async evaluate(): Promise<ClassifierEvaluationResultType> {
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
        numClasses
      )
      .array();

    var accuracy: number[];
    var crossEntropy: number[];
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
          inferredTensors.probs as Tensor
        )
        .array()) as number[];
      crossEntropy = (await metrics
        .categoricalCrossentropy(
          inferredTensors.ys,
          inferredTensors.probs as Tensor
        )
        .array()) as number[];
    }

    const { precision, recall, f1Score } = evaluateConfusionMatrix(
      numClasses,
      confusionMatrix
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

  stopTraining(): void {
    if (!this._model) {
      throw Error("Model not loaded");
    }

    if (this.graph) {
      throw Error("Early stop not implemented for graph model");
    }

    (this._model as LayersModel).stopTraining = true;
  }

  dispose() {
    if (!this._model) {
      throw Error(`"${this.name}" Model not loaded`);
    }
    this._model.dispose();
  }

  get modelLoaded() {
    return this._model !== undefined;
  }

  get numClasses() {
    return this.defaultOutputShape[0];
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

  get trainingLoaded() {
    return this._trainingDataset !== undefined;
  }

  get validationLoaded() {
    return this._validationDataset !== undefined;
  }

  get inferenceLoaded() {
    return this._inferenceDataset !== undefined;
  }

  get modelSummary() {
    if (this.graph) {
      throw Error("Graph model summaries unavailale");
    }
    return getLayersModelSummary(this._model as LayersModel);
  }

  onEpochEnd: TrainingCallbacks["onEpochEnd"] = async (epochs, logs) => {};
}
