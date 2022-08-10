import { Tensor, data, Rank } from "@tensorflow/tfjs";
import { SegmenterStoreType } from "types/SegmenterStoreType";

export const segmentationValDataSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}):
  | data.Dataset<{
      xs: Tensor<Rank.R4>;
      ys: Tensor<Rank.R4>;
      id: Tensor<Rank.R1>;
    }>
  | undefined => {
  return segmenter.valDataSet;
};
