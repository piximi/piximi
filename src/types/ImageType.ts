import { Tensor4D } from "@tensorflow/tfjs";
import { BitDepth } from "image-js";
import { Shape } from "./Shape";
import { AnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";
import { Colors } from "./tensorflow";

export type ImageType = {
  annotations: Array<AnnotationType>;
  activePlane: number;
  categoryId: string;
  colors: Colors;
  bitDepth: BitDepth;
  id: string;
  name: string;
  shape: Shape;
  data: Tensor4D; // [Z, H, W, C]
  partition: Partition;
  segmentationPartition?: Partition;
  visible: boolean;
  src: string; // The URI to be displayed on the canvas
};

export type ShadowImageType = {
  annotations: Array<AnnotationType>;
  activePlane: number;
  categoryId?: string;
  colors: Colors;
  bitDepth: BitDepth;
  id: string;
  name: string;
  shape: Shape;
  data?: Tensor4D; // [Z, H, W, C]
  partition?: Partition;
  segmentationPartition?: Partition;
  visible?: boolean;
  src: string; // The URI to be displayed on the canvas
};
