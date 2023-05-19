import { ToolType } from "./ToolType";
import { AnnotationModeType } from "./AnnotationModeType";
import { AnnotationStateType } from "./AnnotationStateType";

export type AnnotatorStore = {
  annotationState: AnnotationStateType;
  penSelectionBrushSize: number;
  quickSelectionRegionSize: number;
  thresholdAnnotationValue: number;
  selectionMode: AnnotationModeType;
  toolType: ToolType;
};
