import { ThemeMode } from "types/ThemeMode";
import { AlertStateType } from "./AlertStateType";

export enum HotkeyView {
  MainImageGrid,
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
