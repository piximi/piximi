import { useDispatch, useSelector } from "react-redux";

import { CollapsibleListItem } from "../../../components/CollapsibleListItem";
import { DatasetSettings } from "sections/forms/DatasetSettings";
import { segmenterSlice } from "store/segmenter";
import { selectSegmenterShuffleOptions } from "store/segmenter/selectors";

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
