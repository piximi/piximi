import { AnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";

export type SerializedImageType = {
  imageCategoryId: string;
  imageChannels: number;
  imageChecksum: string;
  imageData: Array<string>;
  imageFilename: string;
  imageFrames: number;
  imageHeight: number;
  imageId: string;
  imagePlanes: number;
  imageWidth: number;
  imagePartition: Partition;
  annotations: Array<AnnotationType>;
};
