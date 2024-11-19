import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { CollapsibleListItem } from "components/CollapsibleListItem";
import { PreprocessingSettings } from "sections/model-settings";

import { classifierSlice } from "store/classifier";
import {
  selectClassifierCropOptions,
  selectClassifierRescaleOptions,
} from "store/classifier/selectors";

import { CropOptions, RescaleOptions } from "utils/models/types";

export const ClassifierPreprocessingListItem = () => {
  const cropOptions = useSelector(selectClassifierCropOptions);
  const rescaleOptions = useSelector(selectClassifierRescaleOptions);

  const dispatch = useDispatch();

  const updateCropOptions = (cropOptions: CropOptions) => {
    dispatch(
      classifierSlice.actions.updateCropOptions({
        cropOptions,
      })
    );
  };

  const updateRescaleOptions = (rescaleOptions: RescaleOptions) => {
    dispatch(
      classifierSlice.actions.updateRescaleOptions({
        rescaleOptions,
      })
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
