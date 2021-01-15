import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import React from "react";
import { useStyles } from "./OperationOptions.css";

type OperationOptionsDrawerProps = {
  description: string;
  name: string;
  settings: React.ReactNode;
};

export const OperationOptions = ({
  description,
  name,
  settings,
}: OperationOptionsDrawerProps) => {
  const classes = useStyles();

  return (
    <Drawer
      anchor="right"
      className={classes.settings}
      classes={{ paper: classes.settingsPaper }}
      variant="permanent"
    >
      <div className={classes.settingsToolbar} />

      <List>
        <ListItem dense>
          <ListItemText primary={name} secondary={description} />
        </ListItem>
      </List>

      <Divider />

      {settings}
    </Drawer>
  );
};
