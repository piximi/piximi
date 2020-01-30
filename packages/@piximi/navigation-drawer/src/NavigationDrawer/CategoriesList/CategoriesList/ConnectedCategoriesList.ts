import {connect} from "react-redux";
import {
  toggleCategoryVisibilityAction,
  updateCategoryVisibilityAction
} from "@piximi/store";
import {Category, Project} from "@piximi/types";
import {Dispatch} from "redux";
import {CategoriesList} from "./CategoriesList";

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
    },
    updateVisibility: (category: Category, visible: boolean) => {
      const payload = {category: category, visible: visible};

      const action = updateCategoryVisibilityAction(payload);

      dispatch(action);
    }
  };
};

export const ConnectedCategoriesList = connect(
  mapStateToProps,
  mapDispatchToProps
)(CategoriesList);
