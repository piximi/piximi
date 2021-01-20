import { Image } from "./Image";
import { ImageViewerOperation } from "./ImageViewerOperation";
import { SelectionMode } from "./SelectionMode";
import { ZoomMode } from "./ZoomMode";

export type ImageViewerState = {
  image?: Image;
  operation: ImageViewerOperation;
  selectionMode: SelectionMode;
  zoomMode: ZoomMode;
};
