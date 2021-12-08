import { Shape } from "./Shape";
import { AnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";

export type Image = {
  categoryId: string;
  id: string;
  name: string;
  nextImage?: string; //id ref to next image in z-stack, if any
  prevImage?: string; //id ref to prev image in z-stack, if any
  src: string;
  originalSrc: string;
  shape: Shape;
  annotations: Array<AnnotationType>;
  partition: Partition;
};
