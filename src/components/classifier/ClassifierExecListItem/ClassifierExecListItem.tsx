import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import { Grid } from "@mui/material";

import {
  FitClassifierListItem,
  PredictClassifierListItem,
  EvaluateClassifierListItem,
} from "../ClassifierListItems";

import { classifierModelStatusSelector } from "store/classifier";

import { APPLICATION_COLORS } from "utils/common/colorPalette";
import { ModelStatus } from "types/ModelType";

export const ClassifierExecListItem = () => {
  const [disabled, setDisabled] = React.useState<boolean>(true);
  const [helperText, setHelperText] =
    React.useState<string>("No trained model");

  const modelStatus = useSelector(classifierModelStatusSelector);

  useEffect(() => {
    if (modelStatus === ModelStatus.Trained) {
      setDisabled(false);
      return;
    }

    setDisabled(true);

    if (
      modelStatus === ModelStatus.InitFit ||
      modelStatus === ModelStatus.Loading ||
      modelStatus === ModelStatus.Training
    ) {
      setHelperText("Disabled during training");
    } else if (modelStatus === ModelStatus.Evaluating) {
      setHelperText("Evaluating...");
    } else if (modelStatus === ModelStatus.Predicting) {
      setHelperText("Predcting...");
    } else if (modelStatus === ModelStatus.Suggesting) {
      setHelperText("Accept/Reject suggested predictions first");
    } else {
      setHelperText("No Trained Model");
    }
  }, [modelStatus]);

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
