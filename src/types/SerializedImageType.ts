import { AnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";

export type SerializedImageType = {
  imageCategoryId: string;
  imageChannels: number;
  imageChecksum: string;
  imageData: Array<string>;
  imageFilename: string;
  imageFrames: number;
  imageHeight: number; // TODO, issue #236: remove
  imageId: string;
  imagePlanes: number;
  imageWidth: number; // TODO, issue #236: remove
  imagePartition: Partition;
  annotations: Array<AnnotationType>;
};
