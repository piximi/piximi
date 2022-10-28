import { Shape } from "./Shape";
import { encodedAnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";
import { Color } from "./Color";

export type ImageType = {
  id: string;
  name: string;
  annotations: Array<encodedAnnotationType>;
  src: string; // The URI to be displayed on the canvas
  activePlane: number;
  shape: Shape;
  colors: Array<Color>;
  categoryId: string;
  originalSrc: Array<Array<string>>; //We keep track of the URIs for each channel, for each slice (used for color adjustment)
  partition: Partition;
  visible: boolean;
  segmentationPartition?: Partition;
};

export type ShadowImageType = {
  id: string;
  name: string;
  annotations: Array<encodedAnnotationType>;
  src: string; // The URI to be displayed on the canvas
  activePlane: number;
  shape: Shape;
  colors: Array<Color>;
  categoryId?: string;
  originalSrc?: Array<Array<string>>; //We keep track of the URIs for each channel, for each slice (used for color adjustment)
  partition?: Partition;
  visible?: boolean;
};
