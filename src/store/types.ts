import { History } from "@tensorflow/tfjs";
import {
  Dispatch,
  EntityState,
  ListenerEffectAPI,
  TypedStartListening,
  UnknownAction,
} from "@reduxjs/toolkit";

import { HotkeyContext, Languages, ThingSortKey } from "utils/common/enums";
import { ThemeMode } from "themes/enums";
import {
  LossFunction,
  Metric,
  ModelStatus,
  OptimizationAlgorithm,
} from "utils/models/enums";

import { AlertState, FilterType } from "utils/common/types";
import {
  ClassifierEvaluationResultType,
  FitOptions,
  PreprocessOptions,
  CompileOptions,
  SegmenterEvaluationResultType,
} from "utils/models/types";
import {
  Kind,
  AnnotationObject,
  Category,
  ImageObject,
  Shape,
  Thing,
} from "./data/types";
import { MeasurementsState } from "./measurements/types";
import {
  AnnotatorState,
  ImageViewerState,
} from "views/ImageViewer/utils/types";

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
  kinds: EntityState<Kind, string>;
  categories: EntityState<Category, string>;
  things: EntityState<AnnotationObject | ImageObject, string>;
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
  selectedModelIdx: Record<Kind["id"], number>;
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

export type AppState = {
  classifier: ClassifierState;
  segmenter: SegmenterState;
  imageViewer: ImageViewerState;
  annotator: AnnotatorState;
  project: ProjectState;
  applicationSettings: AppSettingsState;
  data: DataState;
  measurements: MeasurementsState;
};

export type AppDispatch = Dispatch<UnknownAction>;

export type TypedAppStartListening = TypedStartListening<AppState, AppDispatch>;

export type StoreListemerAPI = ListenerEffectAPI<
  {
    classifier: ClassifierState;
    segmenter: SegmenterState;
    imageViewer: ImageViewerState;
    project: ProjectState;
    applicationSettings: AppSettingsState;
    annotator: AnnotatorState;
    data: DataState;
  },
  AppDispatch,
  unknown
>;
