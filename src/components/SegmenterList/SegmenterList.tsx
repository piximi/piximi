import React from "react";
import { SegmenterSettingsDialog } from "../SegmenterSettingsDialog";
import { FitSegmenterListItem } from "../FitSegmenterListItem";
import { EvaluateSegmenterListItem } from "../EvaluateSegmenterListItem";
import { PredictSegmenterListItem } from "../PredictSegmenterListItem";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import {
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
} from "@mui/material";

export const SegmenterList = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  const onCollapseClick = () => {
    setCollapsed(!collapsed);
  };

  const [openSegmenterSettingsDialog, setOpenSegmenterSettingsDialog] =
    React.useState(false);

  const onOpenSegmenterSettingsDialog = () => {
    setOpenSegmenterSettingsDialog(true);
  };

  const onCloseSegmenterSettingsDialog = () => {
    setOpenSegmenterSettingsDialog(false);
  };

  return (
    <>
      <List dense>
        <ListItem button disabled dense onClick={onCollapseClick}>
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
            <PredictSegmenterListItem />

            <FitSegmenterListItem />

            <EvaluateSegmenterListItem />
          </List>
        </Collapse>
      </List>

      <SegmenterSettingsDialog
        onClose={onCloseSegmenterSettingsDialog}
        open={openSegmenterSettingsDialog}
      />
    </>
  );
};
