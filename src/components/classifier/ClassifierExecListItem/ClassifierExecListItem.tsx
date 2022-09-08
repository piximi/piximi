import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import { Grid } from "@mui/material";

import {
  FitClassifierListItem,
  PredictClassifierListItem,
  EvaluateClassifierListItem,
} from "../ClassifierListItems";

import {
  classifierFittedSelector,
  classifierTrainingFlagSelector,
} from "store/classifier";

import { APPLICATION_COLORS } from "utils/common/colorPalette";

export const ClassifierExecListItem = () => {
  const [disabled, setDisabled] = React.useState<boolean>(true);
  const [helperText, setHelperText] =
    React.useState<string>("No trained model");

  const fitted = useSelector(classifierFittedSelector);
  const training = useSelector(classifierTrainingFlagSelector);

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
      <FitClassifierListItem />

      <PredictClassifierListItem disabled={disabled} helperText={helperText} />

      <EvaluateClassifierListItem disabled={disabled} helperText={helperText} />
    </Grid>
  );
};

/*

*/
