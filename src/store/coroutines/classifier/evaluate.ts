import * as tensorflow from "@tensorflow/tfjs";
import { EvaluationResultType } from "types/EvaluationResultType";
import { Category } from "types/Category";
import { ImageType } from "../../../types/ImageType";

export const evaluate = async (
  model: tensorflow.LayersModel,
  validationData: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor<tensorflow.Rank.R4>;
    ys: tensorflow.Tensor<tensorflow.Rank.R2>;
    label: tensorflow.Tensor<tensorflow.Rank.R1>;
  }>,
  validationImages: ImageType[],
  categories: Category[]
): Promise<EvaluationResultType> => {
  const categoryIDs = categories.map((c: Category) => c.id);
  const numberOfClasses = categoryIDs.length;

  const inferredBatchedTensors = await validationData
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
        labels: items.label,
      };
    })
    .toArray();

  const inferredTensors = inferredBatchedTensors.reduce((prev, curr) => {
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

  const precision = (await tensorflow.metrics
    .precision(inferredTensors.ys, inferredTensors.predsOneHot)
    .array()) as number;
  const recall = (await tensorflow.metrics
    .recall(inferredTensors.ys, inferredTensors.predsOneHot)
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
