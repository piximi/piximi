import { useDispatch, useSelector } from "react-redux";

import { CollapsibleListItem } from "../CollapsibleListItem";
import { DatasetSettings } from "components/forms/DatasetSettings";
import { segmenterSlice, selectSegmenterShuffleOptions } from "store/segmenter";

export const SegmenterDatasetListItem = ({
  trainingPercentage,
  trainable,
}: {
  trainingPercentage: number;
  trainable: boolean;
}) => {
  const dispatch = useDispatch();
  const shuffle = useSelector(selectSegmenterShuffleOptions);

  const dispatchTrainingPercentage = (trainPercentage: number) => {
    dispatch(
      segmenterSlice.actions.updateSegmentationTrainingPercentage({
        trainingPercentage: trainPercentage,
      })
    );
  };
  const toggleShuffle = () => {
    dispatch(
      segmenterSlice.actions.updateShuffleOptions({
        shuffle: !shuffle,
      })
    );
  };

  return (
    <CollapsibleListItem
      primaryText="Dataset Settings"
      carotPosition="start"
      divider={true}
    >
      <DatasetSettings
        dispatchTrainingPercentage={dispatchTrainingPercentage}
        trainingPercentage={trainingPercentage}
        isModelTrainable={trainable}
        shuffleOptions={shuffle}
        toggleShuffleOptions={toggleShuffle}
      />
    </CollapsibleListItem>
  );
};
