import { Classifier } from "./Classifier";
import { Project } from "./Project";
import { Settings } from "./Settings";
import { ImageViewer } from "./ImageViewer";
import { ToolOptionsStateType } from "./ToolOptionsStateType";

export type State = {
  classifier: Classifier;
  imageViewer: ImageViewer;
  project: Project;
  settings: Settings;
  toolOptions: ToolOptionsStateType;
};
