import { ToolType } from "./ToolType";
import { AnnotationModeType } from "./AnnotationModeType";
import { LanguageType } from "./LanguageType";
import { AnnotationStateType } from "./AnnotationStateType";

export type AnnotatorStore = {
  annotationState: AnnotationStateType;
  currentPosition?: { x: number; y: number };
  cursor: string;
  language: LanguageType;
  imageOrigin: { x: number; y: number };
  penSelectionBrushSize: number;
  pointerSelection: {
    dragging: boolean;
    selecting: boolean;
    minimum: { x: number; y: number } | undefined;
    maximum: { x: number; y: number } | undefined;
  };
  quickSelectionRegionSize: number;
  thresholdAnnotationValue: number;
  selectionMode: AnnotationModeType;
  stageHeight: number;
  stageScale: number;
  stageWidth: number;
  stagePosition: { x: number; y: number };
  toolType: ToolType;
  zoomSelection: {
    dragging: boolean;
    minimum: { x: number; y: number } | undefined;
    maximum: { x: number; y: number } | undefined;
    selecting: boolean;
    centerPoint: { x: number; y: number } | undefined;
  };
};
