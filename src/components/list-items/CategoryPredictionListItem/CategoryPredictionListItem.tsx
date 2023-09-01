import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";

import { useTranslation } from "hooks";

import { classifierSlice } from "store/classifier";
import { dataSlice, selectImagesByPartitions } from "store/data";
import { Partition } from "types";

import { ModelStatus } from "types/ModelType";
import { CustomListItemButton } from "../CustomListItemButton";

export const CategoryPredictionListItem = () => {
  const dispatch = useDispatch();

  const [showLabeledImages, setShowLabeledImages] = React.useState(true);

  // Yes, this is supposed to select on training partition
  const inferenceImages = useSelector(selectImagesByPartitions)([
    Partition.Training,
  ]);

  const t = useTranslation();

  const toggleShowLabeledImages = () => {
    const updatedShowLabeledImages = !showLabeledImages;

    setShowLabeledImages(updatedShowLabeledImages);
    dispatch(
      dataSlice.actions.setVisibilityOfImages({
        visible: updatedShowLabeledImages,
        imageIds: inferenceImages.map((image) => image.id),
      })
    );
  };

  const clearPredictions = () => {
    dispatch(dataSlice.actions.clearPredictions({}));

    if (!showLabeledImages) {
      setShowLabeledImages(true);
      dispatch(
        dataSlice.actions.setVisibilityOfImages({
          visible: true,
          imageIds: inferenceImages.map((image) => image.id),
        })
      );
    }

    dispatch(
      classifierSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Trained,
        execSaga: false,
      })
    );
  };

  return (
    <>
      <CustomListItemButton
        primaryText={t("Clear predictions")}
        onClick={clearPredictions}
        icon={<ClearIcon />}
      />
      <CustomListItemButton
        primaryText={t(`${showLabeledImages ? "Hide" : "Show"} labeled images`)}
        onClick={toggleShowLabeledImages}
        icon={showLabeledImages ? <VisibilityOffIcon /> : <VisibilityIcon />}
      />
    </>
  );
};
