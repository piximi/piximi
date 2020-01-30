import {connect} from "react-redux";
import {DeleteImageDialog} from "./DeleteImageDialog";
import {deleteImageAction} from "@piximi/store";
import {Dispatch} from "redux";
import {Image, Project} from "@piximi/types";

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
    deleteImages: (images: Array<Image>) => {
      for (const image of images) {
        const payload = {
          image: image
        };

        const action = deleteImageAction(payload);

        dispatch(action);
      }
    }
  };
};

export const ConnectedDeleteImageDialog = connect(
  mapStateToProps,
  mapDispatchToProps
)(DeleteImageDialog);
