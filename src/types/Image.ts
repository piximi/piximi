import { Shape } from "./Shape";
import { AnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";

export type Image = {
  categoryId: string;
  id: string;
  name: string;
  src: string;
  originalSrc: Array<string>; //array to account for possibility of z-stack
  shape: Shape;
  annotations: Array<AnnotationType>;
  partition: Partition;
  visible: boolean;
};
