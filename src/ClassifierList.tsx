import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import AddIcon from "@material-ui/icons/Add";
import ListItemText from "@material-ui/core/ListItemText";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import SaveIcon from "@material-ui/icons/Save";
import React from "react";
import List from "@material-ui/core/List";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Collapse from "@material-ui/core/Collapse";
import { ListItemSecondaryAction } from "@material-ui/core";
import IconButton from "@material-ui/core/IconButton";
import SettingsIcon from "@material-ui/icons/Settings";
import { ClassifierSettingsDialog } from "./ClassifierSettingsDialog";
import Tooltip from "@material-ui/core/Tooltip";

export const ClassifierList = () => {
  const [collapsed, setCollapsed] = React.useState(true);

  const onCollapseClick = () => {
    setCollapsed(!collapsed);
  };

  const [
    openClassifierSettingsDialog,
    setOpenClassifierSettingsDialog,
  ] = React.useState(false);

  const onOpenClassifierSettingsDialog = () => {
    setOpenClassifierSettingsDialog(true);
  };

  const onCloseClassifierSettingsDialog = () => {
    setOpenClassifierSettingsDialog(false);
  };

  return (
    <React.Fragment>
      <List dense>
        <ListItem button dense onClick={onCollapseClick}>
          <ListItemIcon>
            {collapsed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemIcon>

          <ListItemText primary="Classifier" />

          <ListItemSecondaryAction>
            <Tooltip title="Classifier settings">
              <IconButton edge="end" onClick={onOpenClassifierSettingsDialog}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItem>

        <Collapse in={collapsed} timeout="auto" unmountOnExit>
          <List component="div" dense disablePadding>
            <ListItem button disabled>
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>

              <ListItemText primary="Fit" />
            </ListItem>

            <ListItem button disabled>
              <ListItemIcon>
                <FolderOpenIcon />
              </ListItemIcon>

              <ListItemText primary="Evaluate" />
            </ListItem>

            <ListItem button disabled>
              <ListItemIcon>
                <SaveIcon />
              </ListItemIcon>

              <ListItemText primary="Predict" />
            </ListItem>
          </List>
        </Collapse>
      </List>

      <ClassifierSettingsDialog
        onClose={onCloseClassifierSettingsDialog}
        open={openClassifierSettingsDialog}
      />
    </React.Fragment>
  );
};
