import { Image } from "./Image";
import { ImageViewerOperation } from "./ImageViewerOperation";
import { SelectionMode } from "./SelectionMode";

export type ImageViewerState = {
  image?: Image;
  operation: ImageViewerOperation;
  selectionMode: SelectionMode;
};
