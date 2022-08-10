import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import { FitSegmenterDialog } from "../FitSegmenterDialog";
import { IconButton } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { useDialog } from "hooks/useDialog/useDialog";

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
