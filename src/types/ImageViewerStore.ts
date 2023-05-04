import { ColorAdjustmentOptionsType } from "./ColorAdjustmentOptionsType";

export type ImageViewerStore = {
  colorAdjustment: ColorAdjustmentOptionsType;
  currentIndex: number;
  cursor: string;
  activeImageId?: string;
  activeAnnotationIds: Array<string>;
  previousImageId?: string;
  hiddenCategoryIds: string[];
  activeImageRenderedSrcs: Array<string>;
  imageOrigin: { x: number; y: number };
  workingAnnotationId: string | undefined;
  selectedAnnotationIds: Array<string>;
  stagedAnnotationIds: Array<string>;
  stagedAnnotationsHaveBeenUpdated: boolean;
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
};
