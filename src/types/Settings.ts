import { ThemeMode } from "types/ThemeMode";
import { AlertStateType } from "./AlertStateType";

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
  SaveAnnotationProjectDialog,
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
  imageSelectionSize: number;
  alertState: AlertStateType;
  hotkeyStack: HotkeyView[];
};
