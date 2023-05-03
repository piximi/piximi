import { ImageViewerStore } from "./ImageViewerStore";

export type HistoryStateType = {
  future: Array<ImageViewerStore>;
  past: Array<ImageViewerStore>;
  present: ImageViewerStore;
};
