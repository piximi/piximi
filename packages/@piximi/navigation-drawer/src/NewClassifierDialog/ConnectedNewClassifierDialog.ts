import {connect} from "react-redux";
import {createProjectAction} from "@piximi/store";
import {Project} from "@piximi/types";
import {Dispatch} from "redux";
import {NewClassifierDialog} from "./NewClassifierDialog";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return state.project;
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    openClassifier: (name: string) => {
      const classifier = {
        categories: [],
        images: [],
        name: name
      };

      const payload = {project: classifier};

      const action = createProjectAction(payload);

      dispatch(action);
    }
  };
};

export const ConnectedNewClassifierDialog = connect(
  mapStateToProps,
  mapDispatchToProps
)(NewClassifierDialog);
