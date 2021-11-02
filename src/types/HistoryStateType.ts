import { ImageViewer } from "./ImageViewer";

export type HistoryStateType = {
  future: Array<ImageViewer>;
  past: Array<ImageViewer>;
  present: ImageViewer;
};
