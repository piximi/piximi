import {connect} from "react-redux";
import {Project} from "@piximi/types";
import {EvaluateListItem} from "./EvaluateListItem";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return {
    categories: state.project.categories,
    images: state.project.images
  };
};

export const ConnectedEvaluateListItem = connect(mapStateToProps)(
  EvaluateListItem
);
