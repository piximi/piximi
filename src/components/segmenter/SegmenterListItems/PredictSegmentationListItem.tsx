import {
  CircularProgress,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import LabelImportantIcon from "@mui/icons-material/LabelImportant";
import { useDispatch, useSelector } from "react-redux";
import { segmenterSlice } from "store/slices";
import React, { useEffect } from "react";
import { predictionFlagSelector } from "store/selectors/predictionFlagSelector";
import { useTranslation } from "hooks/useTranslation";
import { DisabledListItem } from "components/common/DisabledListItem";

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

  const predicting = useSelector(predictionFlagSelector);

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
