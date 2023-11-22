import { AnnotationType, DecodedAnnotationType } from "./AnnotationType";
import { ColorAdjustmentOptionsType } from "./ColorAdjustmentOptionsType";
import { ZoomToolOptionsType } from "./ZoomToolOptionsType";
import { FilterType } from "./utility/FilterType";

export type ImageViewer = {
  imageStack: string[];
  colorAdjustment: ColorAdjustmentOptionsType;
  cursor: string;
  activeImageId?: string;
  activeAnnotationIds: Array<string>;
  previousImageId?: string;
  annotationFilters: Required<Pick<FilterType<AnnotationType>, "categoryId">>;
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
  highlightedCategory?: string;
};
