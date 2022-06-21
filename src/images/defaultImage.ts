import { generateDefaultChannels } from "image/imageHelper";
import { UNKNOWN_ANNOTATION_CATEGORY_ID } from "types/Category";
import { ImageType } from "types/ImageType";
import { Partition } from "types/Partition";
import { Shape } from "types/Shape";
import colorImage from "./cell-painting.png";
import * as cellPaintingAnnotations from "./cell-painting.json";

const initialImageShape: Shape = {
  channels: 3,
  frames: 1,
  height: 512,
  planes: 1,
  width: 512,
};

export const defaultImage: ImageType = {
  activePlane: 0,
  categoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
  colors: generateDefaultChannels(3),
  id: "f8eecf66-8776-4e14-acd2-94b44603a1a7",
  annotations: [],
  name: "cell-painting.png",
  partition: Partition.Inference,
  visible: true,
  shape: initialImageShape,
  originalSrc: (cellPaintingAnnotations as any).default[0].imageData,
  src: colorImage,
};
