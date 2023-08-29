import {
  Grid,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
} from "@mui/material";
import { ScatterPlot as ScatterPlotIcon } from "@mui/icons-material";

import { useDialog } from "hooks";

import { FitSegmenterDialog } from "components/dialogs";

export const FitSegmenterListItem = () => {
  const { onClose, onOpen, open } = useDialog(false);

  const onOpenFitSegmenterDialog = () => {
    onOpen();
  };

  return (
    <Grid item xs={4}>
      <ListItemButton onClick={onOpenFitSegmenterDialog}>
        <Stack sx={{ alignItems: "center" }}>
          <ListItemIcon sx={{ justifyContent: "center" }}>
            <ScatterPlotIcon />
          </ListItemIcon>

          <ListItemText primary="Fit" />
        </Stack>
      </ListItemButton>
      <FitSegmenterDialog openedDialog={open} closeDialog={onClose} />
    </Grid>
  );
};
