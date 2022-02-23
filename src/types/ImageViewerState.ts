import { ImageType } from "./ImageType";
import { ImageViewerOperation } from "./ImageViewerOperation";
import { ImageViewerSelectionMode } from "./ImageViewerSelectionMode";
import { ImageViewerZoomMode } from "./ImageViewerZoomMode";

export type ImageViewerState = {
  image?: ImageType;
  operation: ImageViewerOperation;
  selectionMode: ImageViewerSelectionMode;
  zoomMode: ImageViewerZoomMode;
};
