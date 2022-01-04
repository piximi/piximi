import { ListItem, ListItemIcon, ListItemText, Tooltip } from "@mui/material";
import LabelImportantIcon from "@mui/icons-material/LabelImportant";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { useDispatch } from "react-redux";
import { classifierSlice } from "../../store/slices";

import { useStyles } from "../ClassifierList/classifierListTooltip.css";

type PredictClassifierListItemProbs = {
  disabled: boolean;
};

export const PredictClassifierListItem = ({
  disabled,
}: PredictClassifierListItemProbs) => {
  const dispatch = useDispatch();

  const onPredict = async () => {
    dispatch(classifierSlice.actions.predict({}));
  };

  const classes = useStyles();

  return (
    <>
      <Tooltip
        classes={{
          tooltip: classes.customTooltip,
          arrow: classes.customArrow,
        }}
        title={disabled ? "train or open a model before prediction" : ""}
        placement="right"
        arrow
      >
        <ListItem disabled={disabled}>
          <ListItemIcon>
            <LabelImportantIcon />
          </ListItemIcon>
          <ListItemText primary="Predict" />
          <IconButton onClick={onPredict} edge="end" disabled={disabled}>
            <KeyboardArrowRightIcon />
          </IconButton>
        </ListItem>
      </Tooltip>
    </>
  );
};
