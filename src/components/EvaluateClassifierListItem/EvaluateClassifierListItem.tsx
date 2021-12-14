import {
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useStyles } from "../ClassifierList/classifierListTooltip.css";

type EvaluateClassifierListItemProbs = {
  disabled: boolean;
};

export const EvaluateClassifierListItem = ({
  disabled,
}: EvaluateClassifierListItemProbs) => {
  const onEvaluateClick = () => {};

  const classes = useStyles();

  return (
    <>
      <Tooltip
        classes={{
          tooltip: classes.customTooltip,
          arrow: classes.customArrow,
        }}
        title={disabled ? "train or open a model before evaluation" : ""}
        placement="right"
        arrow
      >
        <ListItem disabled={disabled}>
          <ListItemIcon>
            <AssessmentIcon />
          </ListItemIcon>
          <ListItemText primary="Evaluate" />
          <IconButton onClick={onEvaluateClick} edge="end" disabled={disabled}>
            <KeyboardArrowRightIcon />
          </IconButton>
        </ListItem>
      </Tooltip>
    </>
  );
};
