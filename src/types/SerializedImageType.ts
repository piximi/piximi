import { AnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";
import { Color } from "./Color";

export type SerializedImageType = {
  imageCategoryId: string;
  imageChannels: number;
  // TODO: image_data
  // imageColors: Array<Color>; // if missing: imageHelper.generateDefaultChannels(serializedImage.imageChannels)
  // TODO: image_data
  imageData: Array<Array<string>>;
  // TODO: image_data
  imageSrc: string; // missing -- NG
  imageFilename: string;
  // TODO: image_data
  //imageFrames: number;
  imageHeight: number;
  imageId: string;
  imagePlanes: number;
  imageWidth: number;
  imagePartition: Partition;
  annotations: Array<AnnotationType>;
};
