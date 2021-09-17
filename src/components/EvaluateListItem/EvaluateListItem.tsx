import React from "react";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import BarChartIcon from "@material-ui/icons/BarChart";

export const EvaluateListItem = () => {
  const onEvaluateClick = () => {
    console.info("Clicked on evaluate! ");
  };

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
