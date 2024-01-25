import { Tensor4D } from "@tensorflow/tfjs";
import { Partition } from "./Partition";
import { Shape } from "./Shape";
import { BitDepth } from "image-js";

export type ThingType = {
  id: string;
  name?: string;
  src: string;
  partition: Partition;
  kind?: string;
  data: Tensor4D;
  shape: Shape;
  bitDepth: BitDepth;
  categoryId: string;
  containing?: string[];
};
