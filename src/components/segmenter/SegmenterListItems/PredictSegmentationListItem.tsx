import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  CircularProgress,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import LabelImportantIcon from "@mui/icons-material/LabelImportant";

import { useTranslation } from "hooks";

import { DisabledListItem } from "components/common/DisabledListItem";

import { segmentationPredictingFlagSelector } from "store/selectors/segmenter";
import { segmenterSlice } from "store/slices";

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
    <DisabledListItem {...props}>
      <ListItem button onClick={onPredict} disablePadding>
        <ListItemIcon>
          <LabelImportantIcon />
        </ListItemIcon>
        <ListItemText primary={t("Predict Segmentation")} />
      </ListItem>

      {isPredicting && <CircularProgress disableShrink size={20} />}
    </DisabledListItem>
  );
};
