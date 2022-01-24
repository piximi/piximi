import { LayersModel } from "@tensorflow/tfjs";
import * as tensorflow from "@tensorflow/tfjs";
import { EvaluationResultType } from "types/EvaluationResultType";
import { Category } from "types/Category";
import { Image } from "../../../types/Image";

export const evaluate = async (
  model: LayersModel,
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

  var accuracy: number;
  var crossEntropy: number;
  if (numberOfClasses === 2) {
    accuracy = tensorflow.metrics
      .binaryAccuracy(oneHotLabels, oneHotPredictions)
      .dataSync()[0];
    crossEntropy = tensorflow.metrics
      .binaryCrossentropy(oneHotLabels, probabilities2DTensor)
      .dataSync()[0];
  } else {
    accuracy = tensorflow.metrics
      .categoricalAccuracy(oneHotLabels, probabilities2DTensor)
      .dataSync()[0];
    console.log(
      tensorflow.metrics
        .categoricalAccuracy(oneHotLabels, probabilities2DTensor)
        .print()
    );
    crossEntropy = tensorflow.metrics
      .categoricalCrossentropy(oneHotLabels, probabilities2DTensor)
      .dataSync()[0];
  }

  const precision = tensorflow.metrics
    .precision(oneHotLabels, oneHotPredictions)
    .dataSync()[0];
  const recall = tensorflow.metrics
    .recall(oneHotLabels, oneHotPredictions)
    .dataSync()[0];

  return {
    confusionMatrix: confusionMatrix,
    accuracy: accuracy,
    crossEntropy: crossEntropy,
    precision: precision,
    recall: recall,
  };
};
