import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import LabelImportantIcon from "@material-ui/icons/LabelImportant";
import ListItemText from "@material-ui/core/ListItemText";
import React from "react";
import List from "@material-ui/core/List";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Collapse from "@material-ui/core/Collapse";
import IconButton from "@material-ui/core/IconButton";
import SettingsIcon from "@material-ui/icons/Settings";
import { SegmenterSettingsDialog } from "../SegmenterSettingsDialog";
import Tooltip from "@material-ui/core/Tooltip";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import { FitSegmenterListItem } from "../FitSegmenterListItem";
import { EvaluateSegmenterListItem } from "../EvaluateSegmenterListItem";

export const SegmenterList = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  const onCollapseClick = () => {
    setCollapsed(!collapsed);
  };

  const [
    openSegmenterSettingsDialog,
    setOpenSegmenterSettingsDialog,
  ] = React.useState(false);

  const onOpenSegmenterSettingsDialog = () => {
    setOpenSegmenterSettingsDialog(true);
  };

  const onCloseSegmenterSettingsDialog = () => {
    setOpenSegmenterSettingsDialog(false);
  };

  return (
    <React.Fragment>
      <List dense>
        <ListItem button dense onClick={onCollapseClick}>
          <ListItemIcon>
            {collapsed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemIcon>

          <ListItemText primary="Segmenter" />

          <ListItemSecondaryAction>
            <Tooltip title="Segmenter settings">
              <IconButton edge="end" onClick={onOpenSegmenterSettingsDialog}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItem>

        <Collapse in={collapsed} timeout="auto" unmountOnExit>
          <List component="div" dense disablePadding>
            <FitSegmenterListItem />

            <EvaluateSegmenterListItem />

            <ListItem button disabled>
              <ListItemIcon>
                <LabelImportantIcon />
              </ListItemIcon>

              <ListItemText primary="Predict" />
            </ListItem>
          </List>
        </Collapse>
      </List>

      <SegmenterSettingsDialog
        onClose={onCloseSegmenterSettingsDialog}
        open={openSegmenterSettingsDialog}
      />
    </React.Fragment>
  );
};
