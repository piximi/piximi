import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

import {
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";

import { useTranslation } from "hooks";

import { classifierSlice } from "store/classifier";
import { dataSlice, selectInferenceImages } from "store/data";

export const PredictionVisibility = () => {
  const dispatch = useDispatch();

  const [showLabeledImages, setShowLabeledImages] = React.useState(true);
  const inferenceImages = useSelector(selectInferenceImages);

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

    dispatch(classifierSlice.actions.updatePredicted({ predicted: false }));
  };

  return (
    <>
      <ListItem button onClick={clearPredictions}>
        <ListItemText primary={t("Clear predictions")} />
        <ListItemIcon>
          <ClearIcon />
        </ListItemIcon>
      </ListItem>

      <ListItem button onClick={toggleShowLabeledImages}>
        <ListItemText
          primary={t(`${showLabeledImages ? "Hide" : "Show"} labeled images`)}
        />
        <ListItemIcon>
          {showLabeledImages ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </ListItemIcon>
      </ListItem>
    </>
  );
};
