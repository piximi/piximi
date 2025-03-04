import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { CollapsibleListItem } from "components/ui/CollapsibleListItem";
import { DatasetSettings } from "../training-settings";

import { classifierSlice } from "store/classifier";
import { selectActiveClassifierShuffleOptions } from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";

export const ClassifierDatasetListItem = ({
  trainingPercentage,
  trainable,
}: {
  trainingPercentage: number;
  trainable: boolean;
}) => {
  const dispatch = useDispatch();
  const shuffle = useSelector(selectActiveClassifierShuffleOptions);
  const activeKindId = useSelector(selectActiveKindId);

  const dispatchTrainingPercentage = (trainingPercentage: number) => {
    dispatch(
      classifierSlice.actions.updateModelPreprocessOptions({
        settings: { trainingPercentage },
        kindId: activeKindId,
      }),
    );
  };

  const toggleShuffle = () => {
    dispatch(
      classifierSlice.actions.updateModelPreprocessOptions({
        settings: { shuffle },
        kindId: activeKindId,
      }),
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
