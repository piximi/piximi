import type { ReactElement } from "react";

import type { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import type { BBox, DataArray } from "store/data/types";

import type {
  AnnotationMode,
  AnnotationState,
  ToolType,
  ZoomMode,
} from "./enums";

export type ImageViewerState = {
  stagePosition: { x: number; y: number };

  zoomOptions: ZoomToolOptionsType;
};

export type WorkingAnnotation = {
  boundingBox: BBox;
  decodedMask: DataArray; // in-memory only — never stored encoded until commit
  planeId: string; // active plane at draw time
  imageId: string;
};
export type AnnotatorState = {
  /**
   * Only ever the freshly drawn stroke — a committed annotation is never promoted
   * into it, which is what keeps masks from crossing between the Three.js scene
   * and the SVG overlay.
   */
  workingAnnotation: {
    saved: WorkingAnnotation | undefined;
    changes: Partial<WorkingAnnotation>;
  };
  annotationState: AnnotationState;
  penSelectionBrushSize: number;
  quickSelectionRegionSize: number;
  thresholdAnnotationValue: number;
  invertThresholdAnnotation: boolean;
  annotationMode: AnnotationMode;
  /**
   * The annotation a stroke operation targets, once picked. Left undefined when
   * the stroke overlaps exactly one annotation (resolved implicitly) or none.
   */
  pendingTargetIds: Array<string>;
  toolType: ToolType;
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
