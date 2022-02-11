import { AnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";
import { Color } from "./Color";

export type SerializedImageType = {
  imageCategoryId: string;
  imageChannels: number;
  imageColors: Array<Color>; // if missing: imageHelper.generateDefaultChannels(serializedImage.imageChannels)
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
