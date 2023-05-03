import { ThemeMode } from "types/ThemeMode";
import { AlertStateType } from "./AlertStateType";
import { LanguageType } from "./LanguageType";

export enum HotkeyView {
  Annotator,
  Classifier,
  CreateCategoryDialog,
  DeleteAnnotationCategoryDialog,
  DeleteAllCategoriesDialog,
  DeleteCategoryDialog,
  DeleteImagesDialog,
  EditCategoryDialog,
  ExampleClassifierDialog,
  ImageShapeDialog,
  ImportTensorflowModelDialog,
  MainImageGrid,
  MainImageGridAppBar,
  NewProjectDialog,
  ExportAnnotationsDialog,
  SaveFittedModelDialog,
  SaveProjectDialog,
}

export type Settings = {
  // async work for setting initial states,
  // for all store slices,
  // should be completed before this flag is set to true
  init: boolean;
  tileSize: number;
  selectedImages: Array<string>;
  themeMode: ThemeMode;
  imageSelectionColor: string;
  selectedImageBorderWidth: number;
  alertState: AlertStateType;
  hotkeyStack: HotkeyView[];
  language: LanguageType;
  soundEnabled: boolean;
};
