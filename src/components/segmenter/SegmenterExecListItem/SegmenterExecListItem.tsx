import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import { Grid } from "@mui/material";

import {
  FitSegmenterListItem,
  PredictSegmenterListItem,
  EvaluateSegmenterListItem,
} from "../SegmenterListItems";

import {
  fittedSegmentationModelSelector,
  segmentationTrainingFlagSelector,
} from "store/segmenter";

import { APPLICATION_COLORS } from "colorPalette";

export const SegmenterExecListItem = () => {
  const [disabled, setDisabled] = React.useState<boolean>(true);
  const [helperText, setHelperText] =
    React.useState<string>("No trained model");
  const fitted = useSelector(fittedSegmentationModelSelector);
  const training = useSelector(segmentationTrainingFlagSelector);

  useEffect(() => {
    if (training) {
      setDisabled(true);
      setHelperText("Disabled during training");
    }
  }, [training]);

  useEffect(() => {
    if (fitted) {
      setDisabled(false);
    } else {
      setDisabled(true);
      setHelperText("No trained model");
    }
  }, [fitted]);
  return (
    <Grid
      container
      sx={{
        paddingTop: "0.5rem;",
        "& .MuiListItemButton-root": { justifyContent: "center" },
        ".MuiGrid-item:not(:last-child)": {
          borderRight: `1px solid ${APPLICATION_COLORS.borderColor}`,
        },
      }}
    >
      <FitSegmenterListItem />

      <PredictSegmenterListItem disabled={disabled} helperText={helperText} />

      <EvaluateSegmenterListItem
        disabled={true}
        helperText={"Not yet implemented."}
      />
    </Grid>
  );
};
