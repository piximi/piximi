import {
  LayersModel,
  Tensor,
  Tensor1D,
  Tensor2D,
  Tensor4D,
  oneHot,
  math,
  metrics,
  argMax,
} from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import { ClassifierEvaluationResultType } from "types/EvaluationResultType";
import { Category } from "types/Category";
import { OldImageType } from "../../../types/ImageType";

export const evaluateClassifier = async (
  model: LayersModel,
  validationData: Dataset<{
    xs: Tensor4D;
    ys: Tensor2D;
  }>,
  validationImages: OldImageType[],
  categories: Category[]
): Promise<ClassifierEvaluationResultType> => {
  const categoryIDs = categories.map((c: Category) => c.id);
  const numClasses = categoryIDs.length;

  const inferredBatchTensors = await validationData
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
    .confusionMatrix(inferredTensors.labels, inferredTensors.preds, numClasses)
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
      .categoricalAccuracy(inferredTensors.ys, inferredTensors.probs as Tensor)
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
    accuracy: accuracy.reduce((a, b) => a + b) / validationImages.length,
    crossEntropy:
      crossEntropy.reduce((a, b) => a + b) / validationImages.length,
    precision: precision,
    recall: recall,
    f1Score: f1Score,
  };
};

const evaluateConfusionMatrix = (
  nClasses: number,
  confusionMatrix: number[][]
) => {
  var precision = 0;
  var recall = 0;
  var f1Score = 0;

  if (nClasses === 2) {
    precision =
      confusionMatrix[0][0] / (confusionMatrix[0][0] + confusionMatrix[0][1]);
    recall =
      confusionMatrix[0][0] / (confusionMatrix[0][0] + confusionMatrix[1][0]);
    f1Score = (2 * (precision * recall)) / (precision + recall);
  } else {
    var diagonal: number[] = new Array(nClasses).fill(0);
    var rowSums: number[] = new Array(nClasses).fill(0);
    var colSums: number[] = new Array(nClasses).fill(0);
    for (let i = 0; i < nClasses; i++) {
      for (let j = 0; j < nClasses; j++) {
        if (i === j) {
          diagonal[i] += confusionMatrix[i][j];
        }
        rowSums[i] += confusionMatrix[i][j];
        colSums[j] += confusionMatrix[i][j];
      }
    }

    for (let k = 0; k < nClasses; k++) {
      const classKPrecision = diagonal[k] / rowSums[k];
      const classKRecall = diagonal[k] / colSums[k];
      precision += classKPrecision;
      recall += classKRecall;
      f1Score +=
        (2 * (classKPrecision * classKRecall)) /
        (classKPrecision + classKRecall);
    }
    precision /= nClasses;
    recall /= nClasses;
    f1Score /= nClasses;
  }

  return { precision: precision, recall: recall, f1Score: f1Score };
};
