import { History } from "@tensorflow/tfjs";
import {
  AnnotationModeType,
  AnnotationStateType,
  ToolType,
} from "utils/annotator/enums";

import {
  ColorAdjustmentOptionsType,
  ZoomToolOptionsType,
} from "utils/annotator/types";

import { AlertState, FilterType } from "utils/common/types";
import {
  HotkeyView,
  ImageSortKey,
  Languages,
  ThingSortKey_new,
} from "utils/common/enums";
import { ThemeMode } from "themes/enums";

import {
  ClassifierEvaluationResultType,
  FitOptions,
  PreprocessOptions,
  CompileOptions,
  SegmenterEvaluationResultType,
} from "utils/models/types";
import {
  LossFunction,
  Metric,
  ModelStatus,
  OptimizationAlgorithm,
} from "utils/models/enums";

import { DeferredEntityState } from "./entities";
import { AnyAction, Dispatch, TypedStartListening } from "@reduxjs/toolkit";
import {
  AnnotationType,
  DecodedAnnotationType,
  ImageType,
  Kind,
  NewAnnotationType,
  NewCategory,
  NewDecodedAnnotationType,
  NewImageType,
  Shape,
} from "./data/types";

export type SegmenterState = {
  // pre-fit state
  selectedModelIdx: number;
  inputShape: Shape;
  preprocessOptions: PreprocessOptions;
  fitOptions: FitOptions;

  compileOptions: CompileOptions;

  trainingPercentage: number;
  trainingHistory?: History;
  evaluationResult: SegmenterEvaluationResultType;

  modelStatus: ModelStatus;
};

export type ProjectState = {
  name: string;
  selectedImageIds: Array<string>;
  selectedThingIds: Array<string>;
  imageSortKey: ImageSortKey;
  sortType_new: ThingSortKey_new;
  imageFilters: Required<
    Pick<FilterType<ImageType>, "categoryId" | "partition">
  >;
  thingFilters: Record<
    string,
    Required<Pick<FilterType<ImageType>, "categoryId" | "partition">>
  >;
  annotationFilters: Required<Pick<FilterType<AnnotationType>, "categoryId">>;
  highlightedCategory: string | undefined;
  selectedAnnotationIds: string[];
  activeKind: string;
  loadPercent: number;
  loadMessage: string;
};

export type ImageViewerState = {
  imageStack: string[];
  colorAdjustment: ColorAdjustmentOptionsType;
  cursor: string;
  activeImageId?: string;
  activeAnnotationIds: Array<string>;
  previousImageId?: string;
  annotationFilters: Required<Pick<FilterType<AnnotationType>, "categoryId">>;
  filters: Required<Pick<FilterType<NewAnnotationType>, "categoryId">>;
  activeImageRenderedSrcs: Array<string>;
  imageOrigin: { x: number; y: number };
  workingAnnotationId: string | undefined;
  workingAnnotation: {
    saved: DecodedAnnotationType | undefined;
    changes: Partial<DecodedAnnotationType>;
  };
  workingAnnotationNew: {
    saved: NewDecodedAnnotationType | undefined;
    changes: Partial<NewDecodedAnnotationType>;
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

export type DataState = {
  kinds: DeferredEntityState<Kind>;
  categories: DeferredEntityState<NewCategory>;
  things: DeferredEntityState<NewAnnotationType | NewImageType>;
};

export type ClassifierState = {
  // pre-fit state
  selectedModelIdx: number;
  inputShape: Shape;
  preprocessOptions: PreprocessOptions;
  fitOptions: FitOptions;

  learningRate: number;
  lossFunction: LossFunction;
  optimizationAlgorithm: OptimizationAlgorithm;
  metrics: Array<Metric>;

  trainingPercentage: number;
  // post-evaluation results
  evaluationResult: ClassifierEvaluationResultType;
  // status flags
  modelStatus: ModelStatus;
};

export type AppSettingsState = {
  // async work for setting initial states,
  // for all store slices,
  // should be completed before this flag is set to true
  init: boolean;
  tileSize: number;
  themeMode: ThemeMode;
  imageSelectionColor: string;
  selectedImageBorderWidth: number;
  alertState: AlertState;
  hotkeyStack: HotkeyView[];
  language: Languages;
  soundEnabled: boolean;
};

export type AnnotatorState = {
  annotationState: AnnotationStateType;
  penSelectionBrushSize: number;
  quickSelectionRegionSize: number;
  thresholdAnnotationValue: number;
  selectionMode: AnnotationModeType;
  toolType: ToolType;
};

export type AppState = {
  classifier: ClassifierState;
  segmenter: SegmenterState;
  imageViewer: ImageViewerState;
  annotator: AnnotatorState;
  project: ProjectState;
  applicationSettings: AppSettingsState;
  newData: DataState;
};

export type AppDispatch = Dispatch<AnyAction>;

export type TypedAppStartListening = TypedStartListening<AppState, AppDispatch>;
