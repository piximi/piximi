import type { ReactElement } from "react";

import type { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import type { AnnotationObject, BBox, DataArray } from "store/dataV2/types";

import type { RequireOnly } from "utils/types";

import type {
  AnnotationMode,
  AnnotationState,
  ToolType,
  ZoomMode,
} from "./enums";

export type ImageViewerState = {
  colorAdjustment: ColorAdjustmentOptionsType;
  cursor: string;
  imageOrigin: { x: number; y: number };

  stageHeight: number;
  stageScale: number;
  stageWidth: number;
  stagePosition: { x: number; y: number };
  zoomSelection: {
    dragging: boolean;
    minimum: { x: number; y: number } | undefined;
    maximum: { x: number; y: number } | undefined;
    selecting: boolean;
    centerPoint: { x: number; y: number } | undefined;
  };
  zoomOptions: ZoomToolOptionsType;
};

export type WorkingAnnotation = {
  boundingBox: BBox;
  decodedMask: DataArray; // in-memory only — never stored encoded until commit
  planeId: string; // active plane at draw time
  imageId: string;
};
export type AnnotatorState = {
  workingAnnotationId: string | undefined;
  workingAnnotation: {
    saved: WorkingAnnotation | undefined;
    changes: Partial<WorkingAnnotation>;
  };
  annotationState: AnnotationState;
  penSelectionBrushSize: number;
  quickSelectionRegionSize: number;
  thresholdAnnotationValue: number;
  annotationMode: AnnotationMode;
  toolType: ToolType;
};

export type ColorAdjustmentOptionsType = {
  blackPoint: number;
  brightness: number;
  contrast: number;
  exposure: number;
  highlights: number;
  hue: number;
  saturation: number;
  shadows: number;
  vibrance: number;
};

export type ZoomToolOptionsType = {
  automaticCentering: boolean;
  mode: ZoomMode;
  scale: number;
  toActualSize: boolean;
  toFit: boolean;
};
export type OperationType = {
  icon: (color: string) => ReactElement;
  name: string;
  description: string;
  options?: ReactElement;
  action?: () => void;
  hotkey: string;
  mobile?: boolean;
  helpContext?: HelpItem;
};
