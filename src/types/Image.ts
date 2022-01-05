import { Shape } from "./Shape";
import { AnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";

export type Image = {
  categoryId: string;
  id: string;
  name: string;
  activePlane: number; //where we are in the z-stack array
  src: string;
  originalSrc: Array<string>; //array to account for possibility of z-stack
  shape: Shape;
  annotations: Array<AnnotationType>;
  partition: Partition;
};
