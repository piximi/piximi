import { IconButton, ListItemIcon, ListItemText } from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { DisabledClassifierListItem } from "./DisabledClassifierListItem";

type EvaluateClassifierListItemProps = {
  disabled: boolean;
  helperText: string;
};

export const EvaluateClassifierListItem = (
  props: EvaluateClassifierListItemProps
) => {
  const onEvaluateClick = () => {
    alert("Not yet implemented");
  };

  return (
    <DisabledClassifierListItem {...props}>
      <ListItemIcon>
        <AssessmentIcon />
      </ListItemIcon>
      <ListItemText primary="Evaluate" />
      <IconButton
        onClick={onEvaluateClick}
        edge="end"
        disabled={props.disabled}
      >
        <KeyboardArrowRightIcon />
      </IconButton>
    </DisabledClassifierListItem>
  );
};
