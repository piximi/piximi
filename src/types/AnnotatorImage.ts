import { EncodedAnnotationType, Shape } from "types";

export type AnnotatorImage = {
  categoryId?: string;
  id: string;
  annotations: Array<EncodedAnnotationType>;
  name: string;
  shape: Shape;
  originalSrc: string; // original image data
  src: string; // filtered image data
};
