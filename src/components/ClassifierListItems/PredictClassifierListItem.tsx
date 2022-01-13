import { ListItemIcon, ListItemText } from "@mui/material";
import LabelImportantIcon from "@mui/icons-material/LabelImportant";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { useDispatch } from "react-redux";
import { classifierSlice } from "../../store/slices";
import { DisabledClassifierListItem } from "./DisabledClassifierListItem";

type PredictClassifierListItemProps = {
  disabled: boolean;
  helperText: string;
};

export const PredictClassifierListItem = (
  props: PredictClassifierListItemProps
) => {
  const dispatch = useDispatch();

  const onPredict = async () => {
    dispatch(classifierSlice.actions.predict({}));
  };

  return (
    <DisabledClassifierListItem {...props}>
      <ListItemIcon>
        <LabelImportantIcon />
      </ListItemIcon>
      <ListItemText primary="Predict" />
      <IconButton onClick={onPredict} edge="end" disabled={props.disabled}>
        <KeyboardArrowRightIcon />
      </IconButton>
    </DisabledClassifierListItem>
  );
};
