import {
  CircularProgress,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import LabelImportantIcon from "@mui/icons-material/LabelImportant";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../store/slices";
import { DisabledListItem } from "../common/DisabledListItem/DisabledListItem";
import React, { useEffect } from "react";
import { predictionFlagSelector } from "store/selectors/predictionFlagSelector";
import { useTranslation } from "hooks/useTranslation";

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
    <DisabledListItem {...props}>
      <ListItem button onClick={onPredict} disablePadding>
        <ListItemIcon>
          <LabelImportantIcon />
        </ListItemIcon>
        <ListItemText primary={t("Predict")} />
      </ListItem>

      {isPredicting && <CircularProgress disableShrink size={20} />}
    </DisabledListItem>
  );
};
