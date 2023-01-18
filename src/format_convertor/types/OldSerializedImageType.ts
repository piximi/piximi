import { AnnotationType } from "types/AnnotationType";
import { Partition } from "types/Partition";

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
