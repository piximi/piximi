import {connect} from "react-redux";
import {ImageViewer} from "./ImageViewer";
import {
  updateImageBrightnessAction,
  updateImageContrastAction
} from "@piximi/store";
import {Dispatch} from "redux";
import {Project, Image} from "@piximi/types";

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
    saveEdits: (image: Image, brightness: number, contrast: number) => {
      const brightnessPayload = {
        image: image,
        brightness: brightness
      };

      const brightnessAction = updateImageBrightnessAction(brightnessPayload);

      dispatch(brightnessAction);

      const contrastPayload = {
        image: image,
        contrast: contrast
      };

      const contrastAction = updateImageContrastAction(contrastPayload);

      dispatch(contrastAction);
    },
    saveEditsGlobally: (
      images: Image[],
      brightness: number,
      contrast: number
    ) => {
      for (let image of images) {
        const brightnessPayload = {
          image: image,
          brightness: brightness
        };

        const brightnessAction = updateImageBrightnessAction(brightnessPayload);

        dispatch(brightnessAction);

        const contrastPayload = {
          image: image,
          contrast: contrast
        };

        const contrastAction = updateImageContrastAction(contrastPayload);

        dispatch(contrastAction);
      }
    }
  };
};

export const ConnectedImageViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ImageViewer);
