import {connect} from "react-redux";
import {Project} from "@piximi/types";
import {SaveClassifierDialog} from "./SaveClassifierDialog";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return {
    project: state.project
  };
};

export const ConnectedSaveClassifierDialog = connect(mapStateToProps)(
  SaveClassifierDialog
);
