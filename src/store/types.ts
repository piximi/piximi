import {
  Dispatch,
  EntityState,
  TypedStartListening,
  UnknownAction,
} from "@reduxjs/toolkit";

import { HotkeyContext, Languages, GridSortKey } from "utils/enums";
import { ThemeMode } from "themes/enums";

import { AlertState, FilterType } from "utils/types";
import {
  ClassifierEvaluationResultType,
  FitOptions,
  PreprocessSettings,
  OptimizerSettings,
} from "utils/models/types";
import {
  Kind,
  AnnotationObject,
  Category,
  ImageObject,
  Thing,
  TSImageObject,
  TSAnnotationObject,
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
  showSaveProjectDialog: boolean;
};

export type DataState = {
  kinds: EntityState<Kind, string>;
  categories: EntityState<Category, string>;
  things: EntityState<AnnotationObject | ImageObject, string>;
  images: EntityState<TSImageObject, string>;
  annotations: EntityState<TSAnnotationObject, string>;
};

export type SegmenterState = {
  // pre-fit state
  selectedModelIdx?: number;
  inferenceOptions: FitOptions;
};

export type ModelClassMap = Record<number, Category["id"]>;
export type ModelInfo = {
  trainingSet?: string[];
  validationDet?: string[];
  classMap?: ModelClassMap;
  preprocessSettings: PreprocessSettings;
  optimizerSettings: OptimizerSettings;
  evalResults: ClassifierEvaluationResultType[];
};
export type KindClassifier = {
  modelNameOrArch: string | number;
  modelInfoDict: Record<string, ModelInfo>;
};

export type KindClassifierDict = Record<Kind["id"], KindClassifier>;
export type ClassifierState = {
  kindClassifiers: KindClassifierDict;
  showClearPredictionsWarning: boolean;
};

export type ProjectState = {
  name: string;

  selectedThingIds: Array<string>;
  selectedImages: Record<string, Array<number>>;
  selectedAnnotations: Array<string>;
  sortType: GridSortKey;
  thingFilters: Record<
    string, // kind
    Required<Pick<FilterType<Thing>, "categoryId" | "partition">>
  >;
  highlightedCategory: string | undefined;
  activeKind: string;
  kindTabFilters: string[];
  imageChannels: number | undefined;
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

export type AppDispatch = Dispatch<UnknownAction>;

export type TypedAppStartListening = TypedStartListening<AppState, AppDispatch>;
