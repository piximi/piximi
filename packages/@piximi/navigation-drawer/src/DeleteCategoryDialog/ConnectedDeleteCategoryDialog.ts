import {connect} from "react-redux";
import {DeleteCategoryDialog} from "./DeleteCategoryDialog";
import {deleteCategoryAction} from "@piximi/store";
import {Category, Project} from "@piximi/types";
import {Dispatch} from "redux";

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
    deleteCategory: (category: Category) => {
      const payload = {
        category: category
      };

      const action = deleteCategoryAction(payload);

      dispatch(action);
    }
  };
};

export const ConnectedDeleteCategoryDialog = connect(
  mapStateToProps,
  mapDispatchToProps
)(DeleteCategoryDialog);
