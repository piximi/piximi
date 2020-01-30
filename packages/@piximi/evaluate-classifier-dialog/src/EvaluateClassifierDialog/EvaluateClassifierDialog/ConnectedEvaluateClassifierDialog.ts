import {connect} from "react-redux";
import {Project} from "@piximi/types";
import {Dispatch} from "redux";
import {EvaluateClassifierDialog} from "./EvaluateClassifierDialog";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return {
    categories: state.project.categories,
    images: state.project.images
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {};
};

export const ConnectedEvaluateClassifierDialog = connect(
  mapStateToProps,
  mapDispatchToProps
)(EvaluateClassifierDialog);
