import {
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  ScatterPlot as ScatterPlotIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

import { useDialog } from "hooks";

import { FitSegmenterDialog } from "../FitSegmenterDialog/FitSegmenterDialog";

export const FitClassifierListItem = () => {
  const { onClose, onOpen, open } = useDialog(false);

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
      <FitSegmenterDialog openedDialog={open} closeDialog={onClose} />
    </>
  );
};
