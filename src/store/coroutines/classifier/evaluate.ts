import * as tensorflow from "@tensorflow/tfjs";
import { EvaluationResultType } from "types/EvaluationResultType";
import { Category } from "types/Category";
import { ImageType } from "../../../types/ImageType";

export const evaluate = async (
  model: tensorflow.LayersModel,
  validationData: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    ys: tensorflow.Tensor;
    labels: tensorflow.Tensor<tensorflow.Rank.R1>;
    ids: tensorflow.Tensor<tensorflow.Rank.R1>;
  }>,
  validationImages: ImageType[],
  categories: Category[]
): Promise<EvaluationResultType> => {
  const categoryIDs = categories.map((c: Category) => c.id);
  const numberOfClasses = categoryIDs.length;

  const inferredBatchTensors = await validationData
    .map((items) => {
      //@ts-ignore
      const batchProbs = model.predict(items.xs);
      //@ts-ignore
      const batchPred = tensorflow.argMax(batchProbs, 1);
      const batchPredOneHot = tensorflow.oneHot(batchPred, numberOfClasses);
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

  const confusionMatrix = await tensorflow.math
    .confusionMatrix(
      inferredTensors.labels,
      inferredTensors.preds as tensorflow.Tensor1D,
      numberOfClasses
    )
    .array();

  var accuracy: number[];
  var crossEntropy: number[];
  if (numberOfClasses === 2) {
    accuracy = (await tensorflow.metrics
      .binaryAccuracy(inferredTensors.ys, inferredTensors.predsOneHot)
      .array()) as number[];
    crossEntropy = (await tensorflow.metrics
      .binaryCrossentropy(
        inferredTensors.ys,
        inferredTensors.probs as tensorflow.Tensor<tensorflow.Rank>
      )
      .array()) as number[];
  } else {
    accuracy = (await tensorflow.metrics
      .categoricalAccuracy(
        inferredTensors.ys,
        inferredTensors.probs as tensorflow.Tensor<tensorflow.Rank>
      )
      .array()) as number[];
    crossEntropy = (await tensorflow.metrics
      .categoricalCrossentropy(
        inferredTensors.ys,
        inferredTensors.probs as tensorflow.Tensor<tensorflow.Rank>
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
