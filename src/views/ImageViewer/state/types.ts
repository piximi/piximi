import { FilterType } from "utils/types";

import {
  AnnotationObject,
  DecodedAnnotationObject,
  DecodedTSAnnotationObject,
  Shape,
} from "store/data/types";
import {
  AnnotationMode,
  AnnotationState,
  ToolType,
  ZoomMode,
} from "../utils/enums";

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

export type ImageViewerState = {
  colorAdjustment: ColorAdjustmentOptionsType;
  cursor: string;
  filters: Required<Pick<FilterType<AnnotationObject>, "categoryId">>;
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
  imageIsLoading: boolean;
};

export type ProtoAnnotationObject =
  | Omit<DecodedAnnotationObject, "src" | "data">
  | Omit<DecodedTSAnnotationObject, "src" | "data">;

export type ViewableAnnotationObject = {
  annotation: ProtoAnnotationObject;
  fillColor: string;
  imageShape: Shape;
};

export type AnnotatorState = {
  workingAnnotationId: string | undefined;
  workingAnnotation: {
    saved: ProtoAnnotationObject | undefined;
    changes: Partial<ProtoAnnotationObject>;
  };
  annotationState: AnnotationState;
  penSelectionBrushSize: number;
  quickSelectionRegionSize: number;
  thresholdAnnotationValue: number;
  annotationMode: AnnotationMode;
  toolType: ToolType;
};
