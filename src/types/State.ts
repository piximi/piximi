import { Classifier } from "./Classifier";
import { Project } from "./Project";
import { Settings } from "./Settings";
import { ImageViewerStore } from "./ImageViewerStore";
import { ToolOptionsStateType } from "./ToolOptionsStateType";

export type State = {
  classifier: Classifier;
  annotator: ImageViewerStore;
  project: Project;
  settings: Settings;
  toolOptions: ToolOptionsStateType;
};
