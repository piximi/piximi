import { connect } from "react-redux";
import { updateImagesPartitionAction } from "@piximi/store";
import { Classifier } from "@piximi/types";
import { Dispatch } from "redux";
import { FitClassifierDialog } from "./FitClassifierDialog";

type State = {
  classifier: Classifier;
};

const mapStateToProps = (state: State) => {
  return {
    categories: state.classifier.categories,
    images: state.classifier.images,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    setImagesPartition: (partitions: number[]) => {
      const payload = { partitions: partitions };

      const action = updateImagesPartitionAction(payload);

      dispatch(action);
    },
  };
};

export const ConnectedFitClassifierDialog = connect(
  mapStateToProps,
  mapDispatchToProps
)(FitClassifierDialog);
