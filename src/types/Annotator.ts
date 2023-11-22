import { ToolType } from "./ToolType";
import { AnnotationModeType } from "./AnnotationModeType";
import { AnnotationStateType } from "./AnnotationStateType";

export type Annotator = {
  annotationState: AnnotationStateType;
  penSelectionBrushSize: number;
  quickSelectionRegionSize: number;
  thresholdAnnotationValue: number;
  selectionMode: AnnotationModeType;
  toolType: ToolType;
};
