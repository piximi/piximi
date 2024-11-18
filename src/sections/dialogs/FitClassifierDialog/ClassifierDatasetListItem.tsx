import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { CollapsibleListItem } from "../../../components/CollapsibleListItem";
import { classifierSlice } from "store/classifier";
import { DatasetSettings } from "sections/dialogs/FitClassifierDialog/settings/DatasetSettings";
import { selectClassifierShuffleOptions } from "store/classifier/selectors";

export const ClassifierDatasetListItem = ({
  trainingPercentage,
  trainable,
}: {
  trainingPercentage: number;
  trainable: boolean;
}) => {
  const dispatch = useDispatch();
  const shuffle = useSelector(selectClassifierShuffleOptions);
  const dispatchTrainingPercentage = (trainingPercentage: number) => {
    dispatch(
      classifierSlice.actions.updateTrainingPercentage({
        trainingPercentage,
      })
    );
  };

  const toggleShuffle = () => {
    dispatch(
      classifierSlice.actions.updateShuffleOptions({
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
