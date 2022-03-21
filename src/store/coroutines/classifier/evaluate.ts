import * as tensorflow from "@tensorflow/tfjs";
import { EvaluationResultType } from "types/EvaluationResultType";
import { Category } from "types/Category";
import { ImageType } from "../../../types/ImageType";

export const evaluate = async (
  model: tensorflow.LayersModel,
  validationData: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    id: string;
  }>,
  validationImages: ImageType[],
  categories: Category[]
): Promise<EvaluationResultType> => {
  const validationDataArray = await validationData.toArray();
  const predictions: number[] = [];
  const probabilities: any = [];
  validationDataArray.forEach((item: { xs: tensorflow.Tensor; id: string }) => {
    const input = item.xs;
    const y = model.predict(input.expandDims()) as tensorflow.Tensor;
    const yArr = Array.from(y.dataSync());
    probabilities.push(yArr);

    const idx = tensorflow.argMax(y as tensorflow.Tensor, 1).dataSync()[0];

    predictions.push(idx);
  });

  const categoryIDs = categories.map((c: Category) => c.id);
  const numberOfClasses = categoryIDs.length;
  const imageCategoryIDs = validationImages.map(
    (image: ImageType) => image.categoryId
  );
  const labels = imageCategoryIDs.map((id: string) =>
    categoryIDs.findIndex((categoryID: string) => {
      return categoryID === id;
    })
  );

  const tensorPredictions = tensorflow.tensor1d(predictions);
  const tensorLabels = tensorflow.tensor1d(labels);

  const confusionMatrix = await tensorflow.math
    .confusionMatrix(tensorLabels, tensorPredictions, numberOfClasses)
    .array();

  const oneHotLabels = tensorflow.oneHot(labels, numberOfClasses);
  const oneHotPredictions = tensorflow.oneHot(predictions, numberOfClasses);

  const probabilities2DTensor = tensorflow.tensor2d(probabilities);

  var accuracy: number[];
  var crossEntropy: number[];
  if (numberOfClasses === 2) {
    accuracy = (await tensorflow.metrics
      .binaryAccuracy(oneHotLabels, oneHotPredictions)
      .array()) as number[];
    crossEntropy = (await tensorflow.metrics
      .binaryCrossentropy(oneHotLabels, probabilities2DTensor)
      .array()) as number[];
  } else {
    accuracy = (await tensorflow.metrics
      .categoricalAccuracy(oneHotLabels, probabilities2DTensor)
      .array()) as number[];
    crossEntropy = (await tensorflow.metrics
      .categoricalCrossentropy(oneHotLabels, probabilities2DTensor)
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
