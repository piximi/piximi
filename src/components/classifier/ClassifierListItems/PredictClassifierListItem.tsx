import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  CircularProgress,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import { LabelImportant as LabelImportantIcon } from "@mui/icons-material";

import { useTranslation } from "hooks";

import { DisabledClassifierListItem } from "./DisabledClassifierListItem";

import { predictionFlagSelector } from "store/selectors";

import { classifierSlice } from "store/slices";

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

  const predicting = useSelector(predictionFlagSelector);

  useEffect(() => {
    setIsPredicting(predicting);
  }, [predicting]);

  return (
    <DisabledClassifierListItem {...props}>
      <ListItem button onClick={onPredict} disablePadding>
        <ListItemIcon>
          <LabelImportantIcon />
        </ListItemIcon>
        <ListItemText primary={t("Predict")} />
      </ListItem>

      {isPredicting && <CircularProgress disableShrink size={20} />}
    </DisabledClassifierListItem>
  );
};
