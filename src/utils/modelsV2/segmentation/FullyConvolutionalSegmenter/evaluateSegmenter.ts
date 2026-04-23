import { LayersModel, Tensor, data, Rank } from "@tensorflow/tfjs";
import { SegmenterEvaluationResultType } from "../../types";
import { Category, ImageObject } from "store/data/types";

export const evaluateSegmenter = async (
  _model: LayersModel,
  _validationData: data.Dataset<{
    xs: Tensor<Rank.R4>;
    ys: Tensor<Rank.R4>;
    id: Tensor<Rank.R1>;
  }>,
  _validationImages: ImageObject[],
  _categories: Category[],
): Promise<SegmenterEvaluationResultType> => {
  // TODO #357: Implement evaluation of segmentation

  return {
    pixelAccuracy: -1,
    IoUScore: -1,
    diceScore: -1,
  };
};
