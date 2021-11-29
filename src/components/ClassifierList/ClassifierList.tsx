import React from "react";
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
import LabelImportantIcon from "@mui/icons-material/LabelImportant";
import { PredictClassifierListItem } from "../PredictClassifierListItem";

export const ClassifierList = () => {
  const [collapsed, setCollapsed] = React.useState(false);

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
          <PredictClassifierListItem />

          <FitClassifierListItem />

          <EvaluateClassifierListItem />
        </List>
      </Collapse>
    </List>
  );
};
