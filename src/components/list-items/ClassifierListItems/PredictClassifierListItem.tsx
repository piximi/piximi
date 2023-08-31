import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  CircularProgress,
  Grid,
  ListItemIcon,
  ListItemText,
  Stack,
} from "@mui/material";

import { LabelImportant as LabelImportantIcon } from "@mui/icons-material";

import { useTranslation } from "hooks";

import { DisabledListItemButton } from "components/list-items/DisabledListItemButton/DisabledListItemButton";

import { classifierSlice, selectClassifierModelStatus } from "store/classifier";
import { ModelStatus } from "types/ModelType";

type PredictClassifierListItemProps = {
  disabled: boolean;
  helperText: string;
};

export const PredictClassifierListItem = (
  props: PredictClassifierListItemProps
) => {
  const t = useTranslation();
  const dispatch = useDispatch();

  const modelStatus = useSelector(selectClassifierModelStatus);

  const onPredict = () => {
    dispatch(
      classifierSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Predicting,
        execSaga: true,
      })
    );
  };

  return (
    <Grid item xs={4}>
      <DisabledListItemButton {...props} onClick={onPredict}>
        <Stack sx={{ alignItems: "center" }}>
          <ListItemIcon sx={{ justifyContent: "center" }}>
            {modelStatus === ModelStatus.Predicting ? (
              <CircularProgress disableShrink size={24} />
            ) : (
              <LabelImportantIcon />
            )}
          </ListItemIcon>
          <ListItemText primary={t("Predict")} />
        </Stack>
      </DisabledListItemButton>
    </Grid>
  );
};
