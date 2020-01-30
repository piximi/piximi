import {connect} from "react-redux";
import {updateCategoryVisibilityAction} from "@piximi/store";
import {ChangeCategoryVisibilityMenuItem} from "./ChangeCategoryVisibilityMenuItem";
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
    makeCategoryInvisible: (category: Category, visible: boolean) => {
      const payload = {category: category, visible: visible};

      const action = updateCategoryVisibilityAction(payload);

      dispatch(action);
    }
  };
};

export const ConnectedChangeCategoryVisibilityMenuItem = connect(
  mapStateToProps,
  mapDispatchToProps
)(ChangeCategoryVisibilityMenuItem);
