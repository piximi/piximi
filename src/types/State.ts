import { Classifier } from "./Classifier";
import { Project } from "./Project";
import { ApplicationSettings } from "./ApplicationSettings";
import { ImageViewer } from "./ImageViewer";
import { ToolOptionsStateType } from "./ToolOptionsStateType";

export type State = {
  classifier: Classifier;
  annotator: ImageViewer;
  project: Project;
  applicationSettings: ApplicationSettings;
  toolOptions: ToolOptionsStateType;
};
