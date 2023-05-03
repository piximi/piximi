import { Classifier } from "./Classifier";
import { Project } from "./Project";
import { Settings } from "./Settings";
import { ImageViewer } from "./ImageViewerStore";
import { ToolOptionsStateType } from "./ToolOptionsStateType";

export type State = {
  classifier: Classifier;
  annotator: ImageViewer;
  project: Project;
  settings: Settings;
  toolOptions: ToolOptionsStateType;
};
