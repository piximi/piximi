import { Shape } from "./Shape";
import { AnnotationType } from "./AnnotationType";
import { Partition } from "./Partition";
import { Color } from "./Color";

export type ImageType = {
  annotations: Array<AnnotationType>;
  activePlane: number;
  categoryId: string;
  colors: Array<Color>;
  id: string;
  name: string;
  originalSrc: Array<Array<string>>; //We keep track of the URIs for each channel, for each slice (used for color adjustment)
  partition: Partition;
  visible: boolean;
  shape: Shape;
  src: string; // The URI to be displayed on the canvas
};
