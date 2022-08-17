import {
  Grid,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
} from "@mui/material";

import { ScatterPlot as ScatterPlotIcon } from "@mui/icons-material";

import { useDialog } from "hooks";

import { FitClassifierDialog } from "../FitClassifierDialog/FitClassifierDialog";

export const FitClassifierListItem = () => {
  const { onClose, onOpen, open } = useDialog(false);

  const onFitClick = () => {
    onOpen();
  };

  return (
    <Grid item xs={4}>
      <ListItemButton onClick={onFitClick}>
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
