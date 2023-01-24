import { encodedAnnotationType } from "types";
import { Partition } from "./Partition";
import { ColorsRaw } from "./tensorflow";

export type SerializedImageType = {
  name: string; // prev imageFilename
  id: string; // prev imageId

  planes: number; // z, prev imagePlanes
  height: number; // h, prev imageHeight
  width: number; // w, prev imageWidth
  channels: number; // c, prev imageChannels
  data: number[][][][]; // to add
  bitDepth: number;
  colors: ColorsRaw; // to add

  partition: Partition; // prev imagePartition
  categoryId: string; // prev imageCategoryId
  annotations: Array<encodedAnnotationType>;

  src?: string;
};
