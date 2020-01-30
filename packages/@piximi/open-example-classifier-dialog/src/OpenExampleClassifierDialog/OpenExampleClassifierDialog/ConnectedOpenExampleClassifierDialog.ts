import {connect} from "react-redux";
import {Category, Project, Image} from "@piximi/types";
import {Dispatch} from "redux";
import {openProjectAction} from "@piximi/store";
import {OpenExampleClassifierDialog} from "./OpenExampleClassifierDialog";

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
    openClassifier: async (
      categories: Category[],
      images: Image[],
      name: string
    ) => {
      const project: Project = {
        categories: categories,
        images: images,
        name: name
      };

      const payload = {project: project};

      const action = openProjectAction(payload);

      dispatch(action);
    }
  };
};

export const ConnectedOpenExampleClassifierDialog = connect(
  mapStateToProps,
  mapDispatchToProps
)(OpenExampleClassifierDialog);
