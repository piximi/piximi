import {connect} from "react-redux";
import {updateImagesVisibilityAction} from "@piximi/store";
import {Dispatch} from "redux";
import {Image, Project} from "@piximi/types";
import {GalleryDialogAppBar} from "./GalleryDialogAppBar";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return {
    images: state.project.images,
    categories: state.project.categories
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    changeImagesVisibility: (images: Array<Image>, visible: boolean) => {
      const payload = {
        images: images,
        visible: visible
      };

      const action = updateImagesVisibilityAction(payload);

      dispatch(action);
    }
  };
};

export const ConnectedGalleryDialogAppBar = connect(
  mapStateToProps,
  mapDispatchToProps
)(GalleryDialogAppBar);
