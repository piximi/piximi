import {
  LayersModel,
  Tensor,
  data,
  Rank,
  tidy,
  argMax,
  image,
} from "@tensorflow/tfjs";
import { AnnotationType } from "types/AnnotationType";
import { Category, UNKNOWN_ANNOTATION_CATEGORY_ID } from "types/Category";
import { ImageType } from "types/ImageType";
import { decodeSegmentationMaskToAnnotations } from "./segmentationMasks";

export const predictSegmentations = async (
  model: LayersModel,
  inferenceData: data.Dataset<{
    xs: Tensor<Rank.R4>;
    ys: Tensor<Rank.R4>;
    id: Tensor<Rank.R1>;
  }>,
  inferenceImages: ImageType[],
  categories: Category[]
): Promise<
  Array<{
    annotations: Array<AnnotationType>;
    imageId: string;
  }>
> => {
  const createdCategories = categories.filter((category) => {
    return category.id !== UNKNOWN_ANNOTATION_CATEGORY_ID;
  });

  const inferredBatchTensors = await inferenceData
    .mapAsync(async (item) => {
      const itemId = await item.id.array();
      const itemShape = inferenceImages.find(
        (image) => image.id === (itemId[0] as unknown as string)
      )?.shape;

      const batchPred: Tensor<Rank.R3> = tidy(() => {
        const batchProbs = model.predict(item.xs);
        const labelIndexPrediction: Tensor<Rank.R3> = argMax(
          batchProbs as Tensor,
          3
        );
        const resizedPrediction = image.resizeBilinear(labelIndexPrediction, [
          itemShape!.height,
          itemShape!.width,
        ]);
        return resizedPrediction;
      });

      return {
        preds: batchPred as Tensor<Rank.R3>,
        id: item.id as Tensor<Rank.R1>,
      };
    })
    .toArray();

  const inferredTensors = inferredBatchTensors.reduce((prev, curr) => {
    return {
      preds: prev.preds.concat(curr.preds),
      id: prev.id.concat(curr.id),
    };
  });

  const imageIds = (await inferredTensors.id.array()) as unknown as string[];
  const predictions = await inferredTensors.preds.array();

  const predictedAnnotations: Array<{
    annotations: Array<AnnotationType>;
    imageId: string;
  }> = imageIds.map((imageId, idx) => {
    const predictedSegmentationMap = predictions[idx];

    const imageShape = inferenceImages.find(
      (image) => image.id === imageId
    )?.shape;

    const annotations = decodeSegmentationMaskToAnnotations(
      createdCategories,
      predictedSegmentationMap,
      imageShape!
    );

    return { imageId: imageId, annotations: annotations };
  });

  return predictedAnnotations;
};
