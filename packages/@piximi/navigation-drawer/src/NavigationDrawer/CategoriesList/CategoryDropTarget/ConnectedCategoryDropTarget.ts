import {connect} from "react-redux";
import {updateImagesCategoryAction} from "@piximi/store";
import {Category, Image, Project} from "@piximi/types";
import {Dispatch} from "redux";
import {CategoryDropTarget} from "./CategoryDropTarget";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return {
    categories: state.project.categories
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    updateImagesCategory: (images: Array<Image>, category: Category) => {
      const payload = {
        images: images,
        category: category
      };

      const action = updateImagesCategoryAction(payload);

      dispatch(action);
    }
  };
};

export const ConnectedCategoryDropTarget = connect(
  mapStateToProps,
  mapDispatchToProps
)(CategoryDropTarget);
