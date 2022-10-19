import { AnnotationType } from "./AnnotationType";
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
  annotations: Array<AnnotationType>;

  src?: string;
};

//TODO: image_data - remove this
export type _SerializedImageType = {
  imageCategoryId: string;
  imageChannels: number;
  imageData: Array<Array<string>>;
  imageSrc: string; // missing -- NG
  imageFilename: string;
  imageFrames: number;
  imageHeight: number;
  imageId: string;
  imagePlanes: number;
  imageWidth: number;
  imagePartition: Partition;
  annotations: Array<AnnotationType>;
};
