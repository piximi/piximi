import React from "react";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import BarChartIcon from "@material-ui/icons/BarChart";
import { useImage } from "../../hooks/useImage/useImage";

export const EvaluateClassifierListItem = () => {
  const image = useImage();

  if (!image) return <React.Fragment />;

  const onEvaluateClick = () => {};

  return (
    <React.Fragment>
      <ListItem button onClick={onEvaluateClick}>
        <ListItemIcon>
          <BarChartIcon />
        </ListItemIcon>

        <ListItemText primary="Evaluate" />
      </ListItem>
    </React.Fragment>
  );
};
