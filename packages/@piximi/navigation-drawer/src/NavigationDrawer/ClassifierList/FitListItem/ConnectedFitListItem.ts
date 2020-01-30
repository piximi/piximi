import {connect} from "react-redux";
import {Project} from "@piximi/types";
import {FitListItem} from "./FitListItem";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return {
    categories: state.project.categories,
    images: state.project.images
  };
};

export const ConnectedFitListItem = connect(mapStateToProps)(FitListItem);
