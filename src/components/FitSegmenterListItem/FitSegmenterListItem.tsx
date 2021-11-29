import React from "react";
import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";

export const FitSegmenterListItem = () => {
  const onFitClick = () => {};

  return (
    <ListItem button onClick={onFitClick}>
      <ListItemIcon>
        <ScatterPlotIcon />
      </ListItemIcon>

      <ListItemText primary="Fit" />
    </ListItem>
  );
};
