import {connect} from "react-redux";
import {Image, Project, Score} from "@piximi/types";
import {PredictListItem} from "./PredictListItem";
import {Dispatch} from "redux";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return {
    categories: state.project.categories,
    classifier: state.project,
    images: state.project.images
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    createImageScore: (images: Array<Image>, scores: Array<Array<Score>>) => {}
  };
};

export const ConnectedPredictListItem = connect(
  mapStateToProps,
  mapDispatchToProps
)(PredictListItem);
