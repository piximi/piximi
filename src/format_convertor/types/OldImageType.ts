import { Shape, Partition, AnnotationType } from "types";
import { _Color } from "./OldColor";

//@TODO: image_data

export type _ImageType = {
  annotations: Array<AnnotationType>;
  activePlane: number;
  categoryId: string;
  colors: Array<_Color>;
  id: string;
  name: string;
  originalSrc: Array<Array<string>>; //We keep track of the URIs for each channel, for each slice (used for color adjustment)
  partition: Partition;
  segmentationPartition?: Partition;
  visible: boolean;
  shape: Shape;
  src: string; // The URI to be displayed on the canvas
};

export type _ShadowImageType = {
  id: string;
  name: string;
  annotations: Array<AnnotationType>;
  src: string; // The URI to be displayed on the canvas
  activePlane: number;
  shape: Shape;
  colors: Array<_Color>;
  categoryId?: string;
  originalSrc?: Array<Array<string>>; //We keep track of the URIs for each channel, for each slice (used for color adjustment)
  partition?: Partition;
  visible?: boolean;
};
