import { Shape } from "./Shape";
import { AnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";

export type Image = {
  categoryId?: string;
  id: string;
  name: string;
  src: string;
  originalSrc: string;
  shape: Shape;
  annotations: Array<AnnotationType>;
  partition: Partition;
};
