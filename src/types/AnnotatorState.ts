import { OldImageType } from "./ImageType";
import { AnnotatorOperation } from "./AnnotatorOperation";
import { AnnotatorSelectionMode } from "./AnnotatorSelectionMode";
import { AnnotatorZoomMode } from "./AnnotatorZoomMode";

export type AnnotatorState = {
  image?: OldImageType;
  operation: AnnotatorOperation;
  selectionMode: AnnotatorSelectionMode;
  zoomMode: AnnotatorZoomMode;
};
