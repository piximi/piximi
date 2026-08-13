import { Dispatch, TypedStartListening, UnknownAction } from "@reduxjs/toolkit";

import { HotkeyContext, Languages } from "utils/enums";
import { ThemeMode } from "themes/enums";

import { AlertState } from "utils/types";

import {
  AnnotatorState,
  ImageViewerState,
} from "views/ImageViewer/utils/types";
import { DataStateV2 } from "./dataV2/types";
import { AppTasksState } from "./appTasks/types";
import { ProjectState } from "views/ProjectViewer/state/types";
import { ClassifierState } from "./classifier/types";
import { ImageViewerDataState } from "@ImageViewer/state/types";
import { MeasurementsState } from "views/MeasurementViewer/types";

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
  showClearPredictionsWarning: boolean;
};

type AppState = {
  classifier: ClassifierState;
  imageViewer: ImageViewerState;
  imageViewerData: ImageViewerDataState;
  annotator: AnnotatorState;
  project: ProjectState;
  applicationSettings: AppSettingsState;
  dataV2: DataStateV2;
  measurements: MeasurementsState;
  appTasks: AppTasksState;
};

export type AppDispatch = Dispatch<UnknownAction>;

export type TypedAppStartListening = TypedStartListening<AppState, AppDispatch>;
