import {
  Grid,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
} from "@mui/material";

import { ScatterPlot as ScatterPlotIcon } from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { FitClassifierDialog } from "components/dialogs";
import { HotkeyView } from "types";

export const FitClassifierListItem = () => {
  const { onClose, onOpen, open } = useDialogHotkey(
    HotkeyView.Classifier,
    false
  );

  return (
    <Grid item xs={4}>
      <ListItemButton onClick={onOpen}>
        <Stack sx={{ alignItems: "center" }}>
          <ListItemIcon sx={{ justifyContent: "center" }}>
            <ScatterPlotIcon />
          </ListItemIcon>

          <ListItemText primary="Fit" />
        </Stack>
      </ListItemButton>
      <FitClassifierDialog openedDialog={open} closeDialog={onClose} />
    </Grid>
  );
};
