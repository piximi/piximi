import { ThemeMode } from "types/ThemeMode";
import { AlertStateType } from "./AlertStateType";

export enum HotkeyView {
  Annotator,
  Classifier,
  CreateCategoryDialog,
  DeleteAnnotationCategoryDialog,
  DeleteAllCategoriesDialog,
  DeleteCategoryDialog,
  EditCategoryDialog,
  ImageShapeDialog,
  MainImageGrid,
  SaveAnnotationProjectDialog,
}
export type Settings = {
  tileSize: number;
  selectedImages: Array<string>;
  themeMode: ThemeMode;
  imageSelectionColor: string;
  imageSelectionSize: number;
  alertState: AlertStateType;
  hotkeyStack: HotkeyView[];
};
