import {connect} from "react-redux";
import {toggleCategoryVisibilityAction} from "@piximi/store";
import {Category, Project} from "@piximi/types";
import {Dispatch} from "redux";
import {CategoryListItem} from "./CategoryListItem";

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
    toggleVisibility: (category: Category) => {
      const payload = {category: category};

      const action = toggleCategoryVisibilityAction(payload);

      dispatch(action);
    }
  };
};

export const ConnectedCategoryListItem = connect(
  mapStateToProps,
  mapDispatchToProps
)(CategoryListItem);
