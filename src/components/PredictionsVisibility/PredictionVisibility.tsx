import React from "react";
import { Button, Checkbox, FormControlLabel, FormGroup } from "@mui/material";
import { classifierSlice, projectSlice } from "store/slices";
import { useDispatch } from "react-redux";
import DeleteIcon from "@mui/icons-material/Delete";

export const PredictionVisibility = () => {
  const dispatch = useDispatch();

  const [showLabeledImages, setShowLabeledImages] = React.useState(true);

  const toggleShowLabeledImages = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const updatedShowLabeledImages = !showLabeledImages;

    setShowLabeledImages(updatedShowLabeledImages);
    dispatch(
      projectSlice.actions.updateLabeledImagesVisibility({
        visibility: updatedShowLabeledImages,
      })
    );
  };

  const onClearPredictionsClick = () => {
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
      <FormGroup>
        <FormControlLabel
          label="Hide labeled images"
          control={
            <Checkbox
              checked={!showLabeledImages}
              onChange={toggleShowLabeledImages}
            />
          }
        />
      </FormGroup>
      <Button
        sx={{ mr: 5 }}
        variant="outlined"
        startIcon={<DeleteIcon />}
        onClick={onClearPredictionsClick}
      >
        Clear predictions
      </Button>
    </>
  );
};
