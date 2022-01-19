import { Shape } from "./Shape";
import { AnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";

export type Image = {
  categoryId: string;
  id: string;
  name: string;
  src: string;
  originalSrc: Array<string>; //TODO this will be come Array<Array<number>> to account for Z x C x M x N dimension
  shape: Shape;
  annotations: Array<AnnotationType>;
  partition: Partition;
};
