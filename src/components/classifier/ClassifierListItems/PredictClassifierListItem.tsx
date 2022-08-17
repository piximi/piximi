import React, { useEffect } from "react";
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

import { DisabledListItemButton } from "components/common/DisabledListItemButton/DisabledListItemButton";

import {
  classifierSlice,
  classifierPredictionFlagSelector,
} from "store/classifier";

type PredictClassifierListItemProps = {
  disabled: boolean;
  helperText: string;
};

export const PredictClassifierListItem = (
  props: PredictClassifierListItemProps
) => {
  const dispatch = useDispatch();

  const t = useTranslation();

  const [isPredicting, setIsPredicting] = React.useState<boolean>(false);

  const onPredict = () => {
    dispatch(classifierSlice.actions.predict({}));
  };

  const predicting = useSelector(classifierPredictionFlagSelector);

  useEffect(() => {
    setIsPredicting(predicting);
  }, [predicting]);

  return (
    <Grid item xs={4}>
      <DisabledListItemButton {...props} onClick={onPredict}>
        <Stack sx={{ alignItems: "center" }}>
          <ListItemIcon sx={{ justifyContent: "center" }}>
            {isPredicting ? (
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
