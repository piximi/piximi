import { ImageViewer } from "./Annotator";

export type HistoryStateType = {
  future: Array<ImageViewer>;
  past: Array<ImageViewer>;
  present: ImageViewer;
};
