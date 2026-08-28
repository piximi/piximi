import type { HotkeyContext, Languages } from "utils/enums";
import type { AlertState } from "utils/types";

import type { ThemeMode } from "themes/enums";

import type {
  AnnotatorState,
  ImageViewerState,
} from "views/ImageViewer/utils/types";
import type {
  Dispatch,
  TypedStartListening,
  UnknownAction,
} from "@reduxjs/toolkit";
import type { DataStateV2 } from "./data/types";
import type { AppTasksState } from "./appTasks/types";
import type { ProjectState } from "views/ProjectViewer/state/types";
import type { ClassifierState } from "./classifier/types";
import type { ImageViewerDataState } from "@ImageViewer/state/types";
import type { MeasurementsState } from "views/MeasurementViewer/types";

export type AppSettingsState = {
  tileSize: number;
  themeMode: ThemeMode;
  imageSelectionColor: string;
  selectedImageBorderWidth: number;
  alertState: AlertState;
  hotkeyStack: HotkeyContext[];
  language: Languages;
  soundEnabled: boolean;
  textOnScroll: boolean;
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
  data: DataStateV2;
  measurements: MeasurementsState;
  appTasks: AppTasksState;
};

export type AppDispatch = Dispatch<UnknownAction>;

export type TypedAppStartListening = TypedStartListening<AppState, AppDispatch>;
