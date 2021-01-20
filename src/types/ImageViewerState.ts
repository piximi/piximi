import { Image } from "./Image";
import { SelectionMode } from "./SelectionMode";

export type ImageViewerState = {
  image?: Image;
  selectionMode: SelectionMode;
};
