import { BitDepth } from "image-js";
import { Colors } from "./tensorflow";
import { ThingType } from "./ThingType";
import { Shape } from "types";
import { Tensor4D } from "@tensorflow/tfjs";
import { Partition } from "./Partition";

export type ImageType = {
  activePlane: number;
  categoryId: string;
  colors: Colors;
  bitDepth: BitDepth;
  id: string;
  name: string;
  shape: Shape;
  data: Tensor4D; // [Z, H, W, C]
  partition: Partition;
  src: string;
  kind?: string;
  containing?: string[]; // The URI to be displayed on the canvas
};

export type NewImageType = ThingType & {
  activePlane: number;
  colors: Colors;
  containing: string[];
};

export type ImageAttributeType = keyof ImageType;

export type NewImageAttributeType = keyof NewImageType;
