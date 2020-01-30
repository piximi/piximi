import {connect} from "react-redux";
import {updateImagesPartitionsAction} from "@piximi/store";
import {Image, Partition, Project} from "@piximi/types";
import {Dispatch} from "redux";
import {FitClassifierDialog} from "./FitClassifierDialog";

type State = {
  project: Project;
};

const mapStateToProps = (state: State) => {
  return {
    categories: state.project.categories,
    images: state.project.images
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    setImagesPartition: (
      images: Array<Image>,
      partitions: Array<Partition>
    ) => {
      const payload = {images: images, partitions: partitions};

      const action = updateImagesPartitionsAction(payload);

      dispatch(action);
    }
  };
};

export const ConnectedFitClassifierDialog = connect(
  mapStateToProps,
  mapDispatchToProps
)(FitClassifierDialog);
