import * as tensorflow from "@tensorflow/tfjs";
import { EvaluationResultType } from "types/EvaluationResultType";
import { Category } from "types/Category";
import { Image } from "../../../types/Image";

export const evaluate = async (
  model: tensorflow.LayersModel,
  validationData: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    id: string;
  }>,
  validationImages: Image[],
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
    (image: Image) => image.categoryId
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

  const precision = (await tensorflow.metrics
    .precision(oneHotLabels, oneHotPredictions)
    .array()) as number;
  const recall = (await tensorflow.metrics
    .recall(oneHotLabels, oneHotPredictions)
    .array()) as number;

  const f1Score = (2 * (precision * recall)) / (precision + recall);

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
