import { Shape } from "./Shape";
import { AnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";

export type Image = {
  categoryId: string;
  id: string;
  name: string;
  src: string;
  originalSrc: Array<Array<Array<number>>>; //TODO explain this (Z x C x mn) where mxn image;
  shape: Shape;
  annotations: Array<AnnotationType>;
  partition: Partition;
};
