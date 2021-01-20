import { Image } from "./Image";
import { ImageViewerOperation } from "./ImageViewerOperation";
import { ImageViewerSelectionMode } from "./ImageViewerSelectionMode";
import { ImageViewerZoomMode } from "./ImageViewerZoomMode";

export type ImageViewerState = {
  image?: Image;
  operation: ImageViewerOperation;
  selectionMode: ImageViewerSelectionMode;
  zoomMode: ImageViewerZoomMode;
};
