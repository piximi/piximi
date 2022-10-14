import { ShapeType } from "./ShapeType";
import { encodedAnnotationType } from "./AnnotationType";

export type ImageViewerImage = {
  categoryId?: string;
  id: string;
  annotations: Array<encodedAnnotationType>;
  name: string;
  shape: ShapeType;
  originalSrc: string; // original image data
  src: string; // filtered image data
};
