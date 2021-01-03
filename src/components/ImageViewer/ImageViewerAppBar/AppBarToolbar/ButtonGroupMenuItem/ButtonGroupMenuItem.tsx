import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import MenuItem from "@material-ui/core/MenuItem";
import React from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import { SelectionMethod } from "../../../../../types/SelectionMethod";
import { useStyles } from "./ButtonGroupMenuItem.css";

type ButtonGroupMenuItemProps = {
  icon: React.ReactElement;
  method: SelectionMethod;
  name: string;
  onClick: (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    method: SelectionMethod
  ) => void;
};

export const ButtonGroupMenuItem = ({
  icon,
  method,
  name,
  onClick,
}: ButtonGroupMenuItemProps) => {
  const classes = useStyles();

  return (
    <MenuItem
      onClick={(event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
        onClick(event, method);
      }}
    >
      <ListItem dense>
        <ListItemIcon className={classes.icon}>
          <SvgIcon fontSize="small">{icon}</SvgIcon>
        </ListItemIcon>

        <ListItemText className={classes.text} primary={name} />
      </ListItem>
    </MenuItem>
  );
};
