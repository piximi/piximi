import { encodedAnnotationType, Shape } from "types";

export type AnnotatorImage = {
  categoryId?: string;
  id: string;
  annotations: Array<encodedAnnotationType>;
  name: string;
  shape: Shape;
  originalSrc: string; // original image data
  src: string; // filtered image data
};
