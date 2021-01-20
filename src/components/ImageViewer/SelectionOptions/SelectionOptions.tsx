import Divider from "@material-ui/core/Divider";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Radio from "@material-ui/core/Radio";
import React from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import { ReactComponent as InvertSelectionIcon } from "../../../icons/InvertSelection.svg";
import { SelectionMode } from "../../../types/SelectionType";

export const SelectionOptions = () => {
  return (
    <React.Fragment>
      <List>
        <ListItem dense disabled>
          <ListItemIcon>
            <Radio disableRipple disabled edge="start" tabIndex={-1} />
          </ListItemIcon>

          <ListItemText
            primary={SelectionMode.New}
            secondary="Create a new selection."
          />
        </ListItem>

        <ListItem dense disabled>
          <ListItemIcon>
            <Radio disableRipple disabled edge="start" tabIndex={-1} />
          </ListItemIcon>

          <ListItemText
            primary={SelectionMode.Addition}
            secondary="Add area to the existing selection."
          />
        </ListItem>

        <ListItem dense disabled>
          <ListItemIcon>
            <Radio disableRipple disabled edge="start" tabIndex={-1} />
          </ListItemIcon>

          <ListItemText
            primary={SelectionMode.Subtraction}
            secondary="Subtract area from the existing selection."
          />
        </ListItem>

        <ListItem dense disabled>
          <ListItemIcon>
            <Radio disableRipple disabled edge="start" tabIndex={-1} />
          </ListItemIcon>

          <ListItemText
            primary={SelectionMode.Intersection}
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
    </React.Fragment>
  );
};
