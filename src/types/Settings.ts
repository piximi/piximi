import { SelectionMethod } from "./SelectionMethod";

export type Settings = {
  tileSize: number;
  selectedImages: Array<string>;
  selectionMethod: SelectionMethod;
};
