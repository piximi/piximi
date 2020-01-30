import {connect} from "react-redux";
import {GalleryDialog} from "./GalleryDialog";
import {Dispatch} from "redux";
import {Category, Image, Project} from "@piximi/types";
import {updateImageCategoryAction} from "@piximi/store";

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
  return {
    updateImageCategory: (image: Image, category: Category) => {
      const payload = {
        image: image,
        category: category
      };

      const action = updateImageCategoryAction(payload);

      dispatch(action);
    }
  };
};

export const ConnectedGalleryDialog = connect(
  mapStateToProps,
  mapDispatchToProps
)(GalleryDialog);
