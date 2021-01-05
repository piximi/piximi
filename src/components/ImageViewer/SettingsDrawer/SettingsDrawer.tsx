import React from "react";
import { Image } from "../../../types/Image";
import { useStyles } from "./SettingsDrawer.css";
import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import Radio from "@material-ui/core/Radio";
import { SelectionType } from "../../../types/SelectionType";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import SvgIcon from "@material-ui/core/SvgIcon";
import { ReactComponent as InvertSelectionIcon } from "../../../icons/InvertSelection.svg";

type OptionsDrawerProps = {
  data: Image;
};

export const SettingsDrawer = ({ data }: OptionsDrawerProps) => {
  const classes = useStyles();

  return (
    <Drawer
      anchor="right"
      className={classes.drawer}
      classes={{ paper: classes.drawerPaper }}
      variant="permanent"
    >
      <div className={classes.toolbar} />

      <Divider />

      <List>
        <ListItem dense>
          <ListItemText
            primary="Rectangular selection"
            secondary="Nam a facilisis velit, sit amet interdum ante. In sodales."
          />
        </ListItem>
      </List>

      <Divider />

      <List>
        <ListItem dense disabled>
          <ListItemIcon>
            <Radio disableRipple disabled edge="start" tabIndex={-1} />
          </ListItemIcon>

          <ListItemText
            primary={SelectionType.New}
            secondary="Create a new selection."
          />
        </ListItem>

        <ListItem dense disabled>
          <ListItemIcon>
            <Radio disableRipple disabled edge="start" tabIndex={-1} />
          </ListItemIcon>

          <ListItemText
            primary={SelectionType.Addition}
            secondary="Add area to the existing selection."
          />
        </ListItem>

        <ListItem dense disabled>
          <ListItemIcon>
            <Radio disableRipple disabled edge="start" tabIndex={-1} />
          </ListItemIcon>

          <ListItemText
            primary={SelectionType.Subtraction}
            secondary="Subtract area from the existing selection."
          />
        </ListItem>

        <ListItem dense disabled>
          <ListItemIcon>
            <Radio disableRipple disabled edge="start" tabIndex={-1} />
          </ListItemIcon>

          <ListItemText
            primary={SelectionType.Intersection}
            secondary="Constrain the boundary of the new selection to the existing selection."
          />
        </ListItem>
      </List>

      <Divider />

      <List>
        <ListItem button dense>
          <ListItemIcon>
            <SvgIcon>
              <InvertSelectionIcon />
            </SvgIcon>
          </ListItemIcon>

          <ListItemText primary="Invert selection" />
        </ListItem>
      </List>
    </Drawer>
  );
};
