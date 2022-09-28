import { Tensor4D } from "@tensorflow/tfjs";
import { Shape } from "./Shape";
import { AnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";
// TODO: image_data replaced with Colors
import { Color } from "./Color";
import { Colors } from "./tensorflow";

export type ImageType = {
  annotations: Array<AnnotationType>;
  activePlane: number;
  categoryId: string;
  colors: Colors;
  id: string;
  name: string;
  data: Tensor4D; // [Z, H, W, C]
  partition: Partition;
  segmentationPartition?: Partition;
  visible: boolean;
  src: string; // The URI to be displayed on the canvas
};

//@TODO: image_data
export type _ImageType = {
  annotations: Array<AnnotationType>;
  activePlane: number;
  categoryId: string;
  colors: Array<Color>;
  id: string;
  name: string;
  originalSrc: Array<Array<string>>; //We keep track of the URIs for each channel, for each slice (used for color adjustment)
  partition: Partition;
  segmentationPartition?: Partition;
  visible: boolean;
  shape: Shape;
  src: string; // The URI to be displayed on the canvas
};

export type ShadowImageType = {
  annotations: Array<AnnotationType>;
  activePlane: number;
  categoryId?: string;
  colors: Array<Color>;
  id: string;
  name: string;
  data?: Tensor4D; // [Z, H, W, C]
  partition?: Partition;
  segmentationPartition?: Partition;
  visible?: boolean;
  src: string; // The URI to be displayed on the canvas
};

//@TODO: image_data
export type _ShadowImageType = {
  id: string;
  name: string;
  annotations: Array<AnnotationType>;
  src: string; // The URI to be displayed on the canvas
  activePlane: number;
  shape: Shape;
  colors: Array<Color>;
  categoryId?: string;
  originalSrc?: Array<Array<string>>; //We keep track of the URIs for each channel, for each slice (used for color adjustment)
  partition?: Partition;
  visible?: boolean;
};
