import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import { FitSegmenterDialog } from "../FitSegmenterDialog/FitSegmenterDialog";
import { IconButton } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { useDialog } from "hooks/useDialog/useDialog";

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
