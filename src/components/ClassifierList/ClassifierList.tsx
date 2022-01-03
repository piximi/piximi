import React, { useEffect } from "react";
import { FitClassifierListItem } from "../FitClassifierListItem";
import { EvaluateClassifierListItem } from "../EvaluateClassifierListItem";
import {
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { PredictClassifierListItem } from "../PredictClassifierListItem";
import { useSelector } from "react-redux";
import { fittedSelector } from "../../store/selectors/fittedSelector";
import { trainingFlagSelector } from "../../store/selectors/trainingFlagSelector";

export const ClassifierList = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  const [disabled, setDisabled] = React.useState<boolean>(true);
  const [helperText, setHelperText] = React.useState<string>(
    "Disabled while not trained model."
  );

  const fitted = useSelector(fittedSelector);
  const training = useSelector(trainingFlagSelector);

  useEffect(() => {
    if (training) {
      setDisabled(true);
      setHelperText("Disabled while training.");
    } else {
    }
  }, [training]);

  useEffect(() => {
    if (fitted) {
      setDisabled(false);
    }
  }, [fitted]);

  const onCollapseClick = () => {
    setCollapsed(!collapsed);
  };

  return (
    <List dense>
      <ListItem button dense onClick={onCollapseClick}>
        <ListItemIcon>
          {collapsed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemIcon>

        <ListItemText primary="Classifier" />
      </ListItem>

      <Collapse in={collapsed} timeout="auto" unmountOnExit>
        <List component="div" dense disablePadding>
          <FitClassifierListItem />

          <PredictClassifierListItem
            disabled={disabled}
            helperText={helperText}
          />

          <EvaluateClassifierListItem
            disabled={disabled}
            helperText={helperText}
          />
        </List>
      </Collapse>
    </List>
  );
};
