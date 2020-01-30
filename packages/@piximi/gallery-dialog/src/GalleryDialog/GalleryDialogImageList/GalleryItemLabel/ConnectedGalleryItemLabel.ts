import {connect} from "react-redux";
import {GalleryItemLabel} from "./GalleryItemLabel";
import {Project} from "@piximi/types";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return {
    categories: state.project.categories
  };
};

export const ConnectedGalleryItemLabel = connect(mapStateToProps)(
  GalleryItemLabel
);
