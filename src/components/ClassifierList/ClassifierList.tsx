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

export const ClassifierList = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [noFittedModel, setNoFittedModel] = React.useState<boolean>(true);

  const fitted = useSelector(fittedSelector);

  useEffect(() => {
    if (fitted) {
      setNoFittedModel(false);
    } else {
      setNoFittedModel(true);
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

          <PredictClassifierListItem disabled={noFittedModel} />

          <EvaluateClassifierListItem disabled={noFittedModel} />
        </List>
      </Collapse>
    </List>
  );
};
