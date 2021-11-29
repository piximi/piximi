import React from "react";
import { useImage } from "../../hooks/useImage/useImage";
import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

function BarChartIcon() {
  return null;
}

export const EvaluateSegmenterListItem = () => {
  const image = useImage();

  if (!image) return <React.Fragment />;

  const onEvaluateClick = () => {
    console.info("Clicked on evaluate! ");
  };

  return (
    <ListItem button onClick={onEvaluateClick}>
      <ListItemIcon>
        <BarChartIcon />
      </ListItemIcon>

      <ListItemText primary="Evaluate" />
    </ListItem>
  );
};
