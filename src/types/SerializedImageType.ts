import { Instance } from "./Instance";

export type SerializedImageType = {
  imageCategoryId: string;
  imageChannels: number;
  imageChecksum: string;
  imageData: string;
  imageFilename: string;
  imageFrames: number;
  imageHeight: number;
  imageId: string;
  imagePlanes: number;
  imageWidth: number;
  imagePartition: number;
  annotations: Array<Instance>;
};
