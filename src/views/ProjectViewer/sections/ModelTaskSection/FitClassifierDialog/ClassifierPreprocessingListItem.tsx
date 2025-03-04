import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { CollapsibleListItem } from "components/ui/CollapsibleListItem";
import { PreprocessingSettings } from "../training-settings";

import { classifierSlice } from "store/classifier";
import {
  selectActiveClassifierCropOptions,
  selectActiveClassifierRescaleOptions,
} from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";

import { CropOptions, RescaleOptions } from "utils/models/types";

export const ClassifierPreprocessingListItem = () => {
  const cropOptions = useSelector(selectActiveClassifierCropOptions);
  const rescaleOptions = useSelector(selectActiveClassifierRescaleOptions);
  const activeKindId = useSelector(selectActiveKindId);

  const dispatch = useDispatch();

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
      />
    </CollapsibleListItem>
  );
};
