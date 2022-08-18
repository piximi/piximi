import {
  LayersModel,
  Tensor,
  Tensor1D,
  Rank,
  oneHot,
  math,
  metrics,
  argMax,
} from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import { ClassifierEvaluationResultType } from "types/EvaluationResultType";
import { Category } from "types/Category";
import { ImageType } from "../../../types/ImageType";

export const evaluateClassifier = async (
  model: LayersModel,
  validationData: Dataset<{
    xs: Tensor;
    ys: Tensor;
    labels: Tensor<Rank.R1>;
    ids: Tensor<Rank.R1>;
  }>,
  validationImages: ImageType[],
  categories: Category[]
): Promise<ClassifierEvaluationResultType> => {
  const categoryIDs = categories.map((c: Category) => c.id);
  const numberOfClasses = categoryIDs.length;

  const inferredBatchTensors = await validationData
    .map((items) => {
      const batchProbs = model.predict(items.xs);
      //@ts-ignore
      const batchPred = argMax(batchProbs, 1);
      const batchPredOneHot = oneHot(batchPred, numberOfClasses);
      return {
        probs: batchProbs,
        preds: batchPred,
        predsOneHot: batchPredOneHot, // ŷs
        ys: items.ys,
        labels: items.labels,
      };
    })
    .toArray();

  const inferredTensors = inferredBatchTensors.reduce((prev, curr) => {
    return {
      probs: prev.probs.concat(curr.probs),
      preds: prev.preds.concat(curr.preds),
      predsOneHot: prev.predsOneHot.concat(curr.predsOneHot), // ŷs
      ys: prev.ys.concat(curr.ys),
      labels: prev.labels.concat(curr.labels),
    };
  });

  const confusionMatrix = await math
    .confusionMatrix(
      inferredTensors.labels,
      inferredTensors.preds as Tensor1D,
      numberOfClasses
    )
    .array();

  var accuracy: number[];
  var crossEntropy: number[];
  if (numberOfClasses === 2) {
    accuracy = (await metrics
      .binaryAccuracy(inferredTensors.ys, inferredTensors.predsOneHot)
      .array()) as number[];
    crossEntropy = (await metrics
      .binaryCrossentropy(
        inferredTensors.ys,
        inferredTensors.probs as Tensor<Rank>
      )
      .array()) as number[];
  } else {
    accuracy = (await metrics
      .categoricalAccuracy(
        inferredTensors.ys,
        inferredTensors.probs as Tensor<Rank>
      )
      .array()) as number[];
    crossEntropy = (await metrics
      .categoricalCrossentropy(
        inferredTensors.ys,
        inferredTensors.probs as Tensor<Rank>
      )
      .array()) as number[];
  }

  const { precision, recall, f1Score } = evaluateConfusionMatrix(
    numberOfClasses,
    confusionMatrix
  );

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
