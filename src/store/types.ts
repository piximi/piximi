import { History } from "@tensorflow/tfjs";
import { AnyAction, Dispatch, TypedStartListening } from "@reduxjs/toolkit";

import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "utils/annotator/enums";
import { HotkeyContext, Languages, ThingSortKey } from "utils/common/enums";
import { ThemeMode } from "themes/enums";
import {
  LossFunction,
  Metric,
  ModelStatus,
  OptimizationAlgorithm,
} from "utils/models/enums";

import { DeferredEntityState } from "./entities";
import { AlertState, FilterType } from "utils/common/types";
import {
  ClassifierEvaluationResultType,
  FitOptions,
  PreprocessOptions,
  CompileOptions,
  SegmenterEvaluationResultType,
} from "utils/models/types";
import {
  ColorAdjustmentOptionsType,
  ZoomToolOptionsType,
} from "utils/annotator/types";
import {
  Kind,
  AnnotationObject,
  Category,
  DecodedAnnotationObject,
  ImageObject,
  Shape,
  Thing,
} from "./data/types";
import { MeasurementsState } from "./measurements/types";

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
  hotkeyStack: HotkeyContext[];
  language: Languages;
  soundEnabled: boolean;
  textOnScroll: boolean;
  loadPercent: number;
  loadMessage: string;
};

export type DataState = {
  kinds: DeferredEntityState<Kind>;
  categories: DeferredEntityState<Category>;
  things: DeferredEntityState<AnnotationObject | ImageObject>;
};

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
  showClearPredictionsWarning: boolean;
};

export type ProjectState = {
  name: string;

  selectedThingIds: Array<string>;
  sortType: ThingSortKey;
  thingFilters: Record<
    string, // kind
    Required<Pick<FilterType<Thing>, "categoryId" | "partition">>
  >;
  highlightedCategory: string | undefined;
  activeKind: string;
  kindTabFilters: string[];
  imageChannels: number | undefined;
};

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

export type AnnotatorState = {
  workingAnnotationId: string | undefined;
  workingAnnotation: {
    saved: DecodedAnnotationObject | undefined;
    changes: Partial<DecodedAnnotationObject>;
  };
  selectedAnnotationIds: Array<string>;
  annotationState: AnnotationState;
  penSelectionBrushSize: number;
  quickSelectionRegionSize: number;
  thresholdAnnotationValue: number;
  selectionMode: AnnotationMode;
  toolType: ToolType;
};

type AppState = {
  classifier: ClassifierState;
  segmenter: SegmenterState;
  imageViewer: ImageViewerState;
  annotator: AnnotatorState;
  project: ProjectState;
  applicationSettings: AppSettingsState;
  data: DataState;
  measurements: MeasurementsState;
};

export type AppDispatch = Dispatch<AnyAction>;

export type TypedAppStartListening = TypedStartListening<AppState, AppDispatch>;
