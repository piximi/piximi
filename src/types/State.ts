import { Classifier } from "./Classifier";
import { Project } from "./Project";
import { Settings } from "./Settings";
import { Annotator } from "./Annotator";
import { ToolOptionsStateType } from "./ToolOptionsStateType";

export type State = {
  classifier: Classifier;
  annotator: Annotator;
  project: Project;
  settings: Settings;
  toolOptions: ToolOptionsStateType;
};
