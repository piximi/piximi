import {connect} from "react-redux";
import {GalleryItem} from "./GalleryItem";
import {updateImageCategoryAction} from "@piximi/store";
import {Dispatch} from "redux";
import {Category, Image, Project} from "@piximi/types";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return {
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

export const ConnectedGalleryItem = connect(
  mapStateToProps,
  mapDispatchToProps
)(GalleryItem);
