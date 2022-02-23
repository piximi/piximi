import React from "react";
import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { classifierSlice, projectSlice } from "store/slices";
import { useDispatch } from "react-redux";
import ClearIcon from "@mui/icons-material/Clear";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useTranslation } from "hooks/useTranslation";

export const PredictionVisibility = () => {
  const dispatch = useDispatch();

  const [showLabeledImages, setShowLabeledImages] = React.useState(true);

  const t = useTranslation();

  const toggleShowLabeledImages = () => {
    const updatedShowLabeledImages = !showLabeledImages;

    setShowLabeledImages(updatedShowLabeledImages);
    dispatch(
      projectSlice.actions.updateLabeledImagesVisibility({
        visibility: updatedShowLabeledImages,
      })
    );
  };

  const clearPredictions = () => {
    dispatch(projectSlice.actions.clearPredictions({}));

    if (!showLabeledImages) {
      setShowLabeledImages(true);
      dispatch(
        projectSlice.actions.updateLabeledImagesVisibility({ visibility: true })
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
