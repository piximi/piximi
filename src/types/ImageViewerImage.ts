import { Shape } from "./Shape";
import { AnnotationType } from "./AnnotationType";

export type ImageViewerImage = {
  categoryId?: string;
  id: string;
  annotations: Array<AnnotationType>;
  name: string;
  shape: Shape;
  originalSrc: string; // original image data
  src: string; // filtered image data
};
