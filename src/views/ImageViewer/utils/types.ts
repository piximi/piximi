import { FilterType, RecursivePartial, RequireOnly, Colors } from "utils/types";
import { AnnotationMode, AnnotationState, ToolType, ZoomMode } from "./enums";
import {
  AnnotationObject,
  Category,
  DecodedAnnotationObject,
  ImageTimepointData,
  Kind,
  TSImageObject,
} from "store/data/types";
import { ReactElement } from "react";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export type ImageViewerImageDetails = {
  id: string;
  activePlane: number;
  activeTimepoint: number;
  renderedSrcs: Record<number, string[]>;
};
export type ImageViewerState = {
  imageStack: Record<string, ImageViewerImageDetails>;
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
  images: Record<string, { timepoints: Record<number, { colors: Colors }> }>;

  annotations: {
    added: Record<string, ProtoAnnotationObject>;
    deleted: string[];
    edited: Record<string, RequireOnly<ProtoAnnotationObject, "id">>;
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
