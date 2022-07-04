import { LayersModel, Tensor, data, Rank } from "@tensorflow/tfjs";
import { Category } from "types/Category";
import { ImageType } from "types/ImageType";

export const drawAnnotationsFromPredictedSegmentation = async (
  model: LayersModel,
  inferenceData: data.Dataset<{
    xs: Tensor<Rank.R4>;
    ys: Tensor<Rank.R4>;
    id: Tensor<Rank.R1>;
  }>,
  inferenceImages: ImageType[],
  categories: Category[]
) => {
  // TODO #357: Convert the segmentation mask output of the model into image annotations
};
