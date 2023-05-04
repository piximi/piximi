import { ToolType } from "./ToolType";
import { AnnotationModeType } from "./AnnotationModeType";
import { AnnotationStateType } from "./AnnotationStateType";
import { PointerSelectionType } from "./PointerSelectionType";

export type AnnotatorStore = {
  annotationState: AnnotationStateType;
  penSelectionBrushSize: number;
  pointerSelection: PointerSelectionType;
  quickSelectionRegionSize: number;
  thresholdAnnotationValue: number;
  selectionMode: AnnotationModeType;
  toolType: ToolType;
};
