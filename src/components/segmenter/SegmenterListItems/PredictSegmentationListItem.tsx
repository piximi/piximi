import React, { useEffect } from "react";
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

import { DisabledListItemButton } from "components/common/DisabledListItemButton";

import {
  segmenterSlice,
  segmentationPredictingFlagSelector,
} from "store/segmenter";

type PredictSegmenterListItemProps = {
  disabled: boolean;
  helperText: string;
};

export const PredictSegmenterListItem = (
  props: PredictSegmenterListItemProps
) => {
  const dispatch = useDispatch();

  const t = useTranslation();

  const [isPredicting, setIsPredicting] = React.useState<boolean>(false);

  const onPredict = () => {
    dispatch(segmenterSlice.actions.predictSegmenter({}));
  };

  const predicting = useSelector(segmentationPredictingFlagSelector);

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
