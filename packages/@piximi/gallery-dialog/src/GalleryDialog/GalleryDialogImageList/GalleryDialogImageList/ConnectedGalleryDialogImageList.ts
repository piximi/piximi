import {connect} from "react-redux";
import {GalleryDialogImageList} from "./GalleryDialogImageList";
import {Project} from "@piximi/types";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return {
    images: state.project.images,
    categories: state.project.categories
  };
};

export const ConnectedGalleryDialogImageList = connect(mapStateToProps)(
  GalleryDialogImageList
);
