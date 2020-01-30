import {connect} from "react-redux";
import {OpenProjectMenuItem} from "./OpenProjectMenuItem";
import {
  Category,
  Project,
  Image,
  FitOptions,
  CompileOptions
} from "@piximi/types";
import {Dispatch} from "redux";
import {openProjectAction} from "@piximi/store";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return {
    categories: state.project.categories
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    openClassifier: (project: Project) => {
      const payload = {
        project: project
      };

      const action = openProjectAction(payload);

      dispatch(action);
    }
  };
};

export const ConnectedOpenProjectMenuItem = connect(
  mapStateToProps,
  mapDispatchToProps
)(OpenProjectMenuItem);
