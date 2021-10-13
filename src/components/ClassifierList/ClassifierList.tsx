import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import LabelImportantIcon from "@material-ui/icons/LabelImportant";
import ListItemText from "@material-ui/core/ListItemText";
import React from "react";
import List from "@material-ui/core/List";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Collapse from "@material-ui/core/Collapse";
import { FitClassifierListItem } from "../FitClassifierListItem";
import { EvaluateClassifierListItem } from "../EvaluateClassifierListItem";

export const ClassifierList = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  const onCollapseClick = () => {
    setCollapsed(!collapsed);
  };

  const [openClassifierSettingsDialog, setOpenClassifierSettingsDialog] =
    React.useState(false);

  const onOpenClassifierSettingsDialog = () => {
    setOpenClassifierSettingsDialog(true);
  };

  const onCloseClassifierSettingsDialog = () => {
    setOpenClassifierSettingsDialog(false);
  };

  return (
    <>
      <List dense>
        <ListItem button dense onClick={onCollapseClick}>
          <ListItemIcon>
            {collapsed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemIcon>

          <ListItemText primary="Classifier" />
        </ListItem>

        <Collapse in={collapsed} timeout="auto" unmountOnExit>
          <List component="div" dense disablePadding>
            <ListItem button disabled>
              <ListItemIcon>
                <LabelImportantIcon />
              </ListItemIcon>

              <ListItemText primary="Predict" />
            </ListItem>

            <FitClassifierListItem />

            <EvaluateClassifierListItem />
          </List>
        </Collapse>
      </List>
    </>
  );
};
