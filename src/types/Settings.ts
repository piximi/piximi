import { ThemeMode } from "types/ThemeMode";
import { AlertStateType } from "./AlertStateType";

export enum HotkeyView {
  Annotator,
  MainImageGrid,
  Classifier,
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
