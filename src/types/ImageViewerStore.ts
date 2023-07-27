import { DecodedAnnotationType } from "./AnnotationType";
import { ColorAdjustmentOptionsType } from "./ColorAdjustmentOptionsType";
import { ZoomToolOptionsType } from "./ZoomToolOptionsType";

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
  workingAnnotation: {
    saved: DecodedAnnotationType | undefined;
    changes: Partial<DecodedAnnotationType>;
  };
  selectedAnnotationIds: Array<string>;
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
};
