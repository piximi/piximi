import {connect} from "react-redux";
import {updateCategoryVisibilityAction} from "@piximi/store";
import {HideOtherCategoriesMenuItem} from "./HideOtherCategoriesMenuItem";
import {Category, Project} from "@piximi/types";
import {Dispatch} from "redux";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return {
    project: state.project
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    makeCategoryInvisible: (category: Category, visibility: boolean) => {
      const payload = {category: category, visible: visibility};

      const action = updateCategoryVisibilityAction(payload);

      dispatch(action);
    }
  };
};

export const ConnectedHideOtherCategoriesMenuItem = connect(
  mapStateToProps,
  mapDispatchToProps
)(HideOtherCategoriesMenuItem);
