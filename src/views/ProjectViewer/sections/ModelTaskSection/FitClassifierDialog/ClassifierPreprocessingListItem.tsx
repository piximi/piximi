import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { CollapsibleListItem } from "components/ui/CollapsibleListItem";
import { PreprocessingSettings } from "../training-settings";

import { classifierSlice } from "store/classifier";
import {
  selectActiveClassifierCropOptions,
  selectActiveClassifierRescaleOptions,
  selectActiveClassifierShuffleOptions,
} from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";

import { CropOptions, RescaleOptions } from "utils/models/types";

export const ClassifierPreprocessingListItem = ({
  trainingPercentage,
  trainable,
}: {
  trainingPercentage: number;
  trainable: boolean;
}) => {
  const dispatch = useDispatch();
  const cropOptions = useSelector(selectActiveClassifierCropOptions);
  const rescaleOptions = useSelector(selectActiveClassifierRescaleOptions);
  const activeKindId = useSelector(selectActiveKindId);
  const shuffle = useSelector(selectActiveClassifierShuffleOptions);

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

  const updateCropOptions = (cropOptions: CropOptions) => {
    dispatch(
      classifierSlice.actions.updateModelPreprocessOptions({
        settings: { cropOptions },
        kindId: activeKindId,
      }),
    );
  };

  const updateRescaleOptions = (rescaleOptions: RescaleOptions) => {
    dispatch(
      classifierSlice.actions.updateModelPreprocessOptions({
        settings: { rescaleOptions },
        kindId: activeKindId,
      }),
    );
  };

  return (
    <CollapsibleListItem
      dense={false}
      primaryText="Preprocessing Settings"
      carotPosition="start"
      divider={true}
    >
      <PreprocessingSettings
        cropOptions={cropOptions}
        rescaleOptions={rescaleOptions}
        updateCropOptions={updateCropOptions}
        updateRescaleOptions={updateRescaleOptions}
        dispatchTrainingPercentage={dispatchTrainingPercentage}
        trainingPercentage={trainingPercentage}
        isModelTrainable={trainable}
        shuffleOptions={shuffle}
        toggleShuffleOptions={toggleShuffle}
      />
    </CollapsibleListItem>
  );
};
