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

import { FitSegmenterDialog } from "../FitSegmenterDialog";

export const FitSegmenterListItem = () => {
  const { onClose, onOpen, open } = useDialog(false);

  const onOpenFitSegmenterDialog = () => {
    onOpen();
  };

  return (
    <>
      <ListItem onClick={() => {}}>
        <ListItemIcon>
          <ScatterPlotIcon />
        </ListItemIcon>

        <ListItemText primary="Fit Segmenter" />
        <IconButton edge="end" onClick={onOpenFitSegmenterDialog}>
          <SettingsIcon />
        </IconButton>
      </ListItem>
      <FitSegmenterDialog openedDialog={open} closeDialog={onClose} />
    </>
  );
};
