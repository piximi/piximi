import { generateDefaultChannels } from "image/utils/imageHelper";
import { UNKNOWN_CATEGORY_ID } from "types/Category";
import { ShadowImageType } from "types/ImageType";
import { Partition } from "types/Partition";
import { Shape } from "types/Shape";
import colorImage from "./cell-painting.png";
// import * as cellPaintingAnnotations from "./cell-painting.json";

const initialImageShape: Shape = {
  planes: 1,
  height: 512,
  width: 512,
  channels: 3,
};

export const defaultImage: ShadowImageType = {
  activePlane: 0,
  categoryId: UNKNOWN_CATEGORY_ID,
  colors: generateDefaultChannels(3),
  bitDepth: 8,
  id: "f8eecf66-8776-4e14-acd2-94b44603a1a7",
  annotations: [],
  name: "cell-painting.png",
  shape: initialImageShape,
  partition: Partition.Inference,
  visible: true,
  data: undefined,
  src: colorImage,
};
