import { LayersModel, Tensor, data, Rank } from "@tensorflow/tfjs";
import { Category, ImageType, SegmenterEvaluationResultType } from "types";

export const evaluateSegmenter = async (
  model: LayersModel,
  validationData: data.Dataset<{
    xs: Tensor<Rank.R4>;
    ys: Tensor<Rank.R4>;
    id: Tensor<Rank.R1>;
  }>,
  validationImages: ImageType[],
  categories: Category[]
): Promise<SegmenterEvaluationResultType> => {
  // TODO #357: Implement evaluation of segmentation

  return {
    pixelAccuracy: -1,
    IoUScore: -1,
    diceScore: -1,
  };
};
