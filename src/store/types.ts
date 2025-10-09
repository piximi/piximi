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
  ImageMetadata,
  LinkNode,
  Tracklet,
  GeneralizedKindItem,
  ImageData,
} from "./data/types";
import { MeasurementsState } from "./measurements/types";
import {
  AnnotatorState,
  ImageViewerState,
} from "views/ImageViewer/state/types";
import { ImageViewerDataState } from "views/ImageViewer/state/image-viewer-data/types";

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
  metadata: EntityState<ImageMetadata, string>;
  images: EntityState<ImageData, string>;
  annotations: EntityState<AnnotationObject, string>;

  relationships: {
    kindToCategories: Record<string, string[]>;
    kindToAnnotations: Record<string, string[]>;
    categoryToAnnotations: Record<string, string[]>;
    categoryToImages: Record<string, string[]>;
    imageToAnnotations: Record<string, string[]>;
    metadataToTracklets: Record<string, string[]>;
  };

  tracklets: Record<string, Tracklet>;
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
  expandedTime: boolean;
  selectedKindItems: Record<string, Array<string>>;
  selectedImages: Record<string, Array<string>>;
  selectedAnnotations: Record<string, Array<string>>;
  sortType: GridSortKey;
  kindItemFilters: Record<
    string, // kind
    Required<Pick<FilterType<GeneralizedKindItem>, "categoryId" | "partition">>
  >;
  activeCtegory: string | undefined;
  activeKind: string;
  kindTabFilters: string[];
  imageChannels: number | undefined;
};

type AppState = {
  classifier: ClassifierState;
  segmenter: SegmenterState;
  imageViewer: ImageViewerState;
  imageViewerData: ImageViewerDataState;
  annotator: AnnotatorState;
  project: ProjectState;
  applicationSettings: AppSettingsState;
  data: DataState;
  measurements: MeasurementsState;
};

export type AppDispatch = Dispatch<UnknownAction>;

export type TypedAppStartListening = TypedStartListening<AppState, AppDispatch>;
