import {connect} from "react-redux";
import {
  updateCategoryColorAction,
  updateCategoryDescriptionAction
} from "@piximi/store";
import {Category, Project} from "@piximi/types";
import {Dispatch} from "redux";
import {EditCategoryDialog} from "./EditCategoryDialog";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return {
    project: state.project.categories
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    updateColor: (category: Category, color: string) => {
      const payload = {category: category, color: color};

      const action = updateCategoryColorAction(payload);

      dispatch(action);
    },
    updateDescription: (category: Category, description: string) => {
      const payload = {category: category, description: description};

      const action = updateCategoryDescriptionAction(payload);

      dispatch(action);
    }
  };
};

export const ConnectedEditCategoryDialog = connect(
  mapStateToProps,
  mapDispatchToProps
)(EditCategoryDialog);
