import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  CircularProgress,
  Grid,
  ListItemIcon,
  ListItemText,
  Stack,
} from "@mui/material";
import LabelImportantIcon from "@mui/icons-material/LabelImportant";

import { useTranslation } from "hooks";

import { DisabledListItemButton } from "components/common/list-items/DisabledListItemButton";

import { segmenterSlice, segmenterModelStatusSelector } from "store/segmenter";
import { ModelStatus } from "types/ModelType";

type PredictSegmenterListItemProps = {
  disabled: boolean;
  helperText: string;
};

export const PredictSegmenterListItem = (
  props: PredictSegmenterListItemProps
) => {
  const t = useTranslation();
  const dispatch = useDispatch();

  const onPredict = () => {
    dispatch(
      segmenterSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Predicting,
        execSaga: true,
      })
    );
  };

  const modelStatus = useSelector(segmenterModelStatusSelector);

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
