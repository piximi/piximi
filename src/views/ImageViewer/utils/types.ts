import { FilterType, RequireOnly } from "utils/types";
import { AnnotationMode, AnnotationState, ToolType, ZoomMode } from "./enums";
import {
  AnnotationObject,
  Category,
  DecodedAnnotationObject,
  Kind,
} from "store/data/types";

export type ImageViewerState = {
  imageStack: string[];
  hasUnsavedChanges: boolean;
  colorAdjustment: ColorAdjustmentOptionsType;
  cursor: string;
  activeImageId?: string;
  activeAnnotationIds: Array<string>;
  previousImageId?: string;
  filters: Required<Pick<FilterType<AnnotationObject>, "categoryId">>;
  activeImageRenderedSrcs: Array<string>;
  imageOrigin: { x: number; y: number };

  selectedCategoryId: string;
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
  highlightedCategory?: string;
};

export type ProtoAnnotationObject = Omit<
  DecodedAnnotationObject,
  "src" | "data"
>;
export type AnnotatorState = {
  workingAnnotationId: string | undefined;
  workingAnnotation: {
    saved: ProtoAnnotationObject | undefined;
    changes: Partial<ProtoAnnotationObject>;
  };
  changes: AnnotatorChanges;
  selectedAnnotationIds: Array<string>;
  annotationState: AnnotationState;
  penSelectionBrushSize: number;
  quickSelectionRegionSize: number;
  thresholdAnnotationValue: number;
  annotationMode: AnnotationMode;
  toolType: ToolType;
};

export type KindEdits = Omit<
  RequireOnly<Kind, "id">,
  "categories" | "containing"
> & {
  categories?: {
    added: string[];
    deleted: string[];
  };
  containing?: {
    added: string[];
    deleted: string[];
  };
};

export type CategoryEdits = Omit<RequireOnly<Category, "id">, "containing"> & {
  containing?: {
    added: string[];
    deleted: string[];
  };
};

export type AnnotatorChanges = {
  kinds: {
    added: Record<string, Kind>;
    deleted: string[];
    edited: Record<string, KindEdits>;
  };
  categories: {
    added: Record<string, Category>;
    deleted: string[];
    edited: Record<string, CategoryEdits>;
  };
  things: {
    added: Record<string, ProtoAnnotationObject>;
    deleted: string[];
    edited: Record<string, RequireOnly<ProtoAnnotationObject, "id">>;
  };
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
