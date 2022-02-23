import { CircularProgress, ListItemIcon, ListItemText } from "@mui/material";
import LabelImportantIcon from "@mui/icons-material/LabelImportant";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../store/slices";
import { DisabledClassifierListItem } from "./DisabledClassifierListItem";
import React, { useEffect } from "react";
import { predictionFlagSelector } from "store/selectors/predictionFlagSelector";

type PredictClassifierListItemProps = {
  disabled: boolean;
  helperText: string;
};

export const PredictClassifierListItem = (
  props: PredictClassifierListItemProps
) => {
  const dispatch = useDispatch();

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
      <ListItemIcon>
        <LabelImportantIcon />
      </ListItemIcon>
      <ListItemText primary="Predict" />

      {isPredicting ? (
        <CircularProgress disableShrink size={20} />
      ) : (
        <IconButton onClick={onPredict} edge="end" disabled={props.disabled}>
          <KeyboardArrowRightIcon />
        </IconButton>
      )}
    </DisabledClassifierListItem>
  );
};
