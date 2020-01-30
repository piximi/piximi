import {connect} from "react-redux";
import {Project} from "@piximi/types";
import {SaveListItem} from "./SaveListItem";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return {
    categories: state.project.categories,
    images: state.project.images
  };
};

export const ConnectedSaveListItem = connect(mapStateToProps)(SaveListItem);
