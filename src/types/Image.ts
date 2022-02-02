import { Shape } from "./Shape";
import { AnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";
import { Color } from "./Color";

export type Image = {
  annotations: Array<AnnotationType>;
  categoryId: string;
  colors: Array<Color>;
  id: string;
  name: string;
  originalSrc: Array<Array<string>>; //TODO explain this (Z x C x mn) where mxn image;
  partition: Partition;
  shape: Shape;
  src: string;
};
