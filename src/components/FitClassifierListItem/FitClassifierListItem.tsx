import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import React from "react";
import { useDialog } from "../../hooks";
import { FitClassifierDialog } from "../FitClassifierDialog/FitClassifierDialog";
import { IconButton } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

export const FitClassifierListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  const onFitClick = () => {
    onOpen();
  };

  return (
    <>
      <ListItem onClick={() => {}}>
        <ListItemIcon>
          <ScatterPlotIcon />
        </ListItemIcon>

        <ListItemText primary="Fit" />
        <IconButton edge="end" onClick={onFitClick}>
          <SettingsIcon />
        </IconButton>
      </ListItem>
      <FitClassifierDialog
        openedDialog={open}
        openedDrawer={true}
        closeDialog={onClose}
      />
    </>
  );
};
