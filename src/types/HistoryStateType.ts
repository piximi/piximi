import { ImageViewer } from "./ImageViewerStore";

export type HistoryStateType = {
  future: Array<ImageViewer>;
  past: Array<ImageViewer>;
  present: ImageViewer;
};
