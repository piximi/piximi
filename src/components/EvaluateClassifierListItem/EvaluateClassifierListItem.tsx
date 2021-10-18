import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import React from "react";
import BarChartIcon from "@mui/icons-material/BarChart";
import { useImage } from "../../hooks/useImage/useImage";

export const EvaluateClassifierListItem = () => {
  const image = useImage();

  if (!image) return <></>;

  const onEvaluateClick = () => {};

  return (
    <>
      <ListItem button onClick={onEvaluateClick}>
        <ListItemIcon>
          <BarChartIcon />
        </ListItemIcon>

        <ListItemText primary="Evaluate" />
      </ListItem>
    </>
  );
};
