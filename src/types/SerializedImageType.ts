import { AnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";
import { Color } from "./Color";

export type SerializedImageType = {
  imageCategoryId: string;
  imageChannels: number;
  imageColors: Array<Color>;
  imageData: Array<Array<string>>;
  imageSrc: string;
  imageFilename: string;
  imageFrames: number;
  imageHeight: number;
  imageId: string;
  imagePlanes: number;
  imageWidth: number;
  imagePartition: Partition;
  annotations: Array<AnnotationType>;
};
