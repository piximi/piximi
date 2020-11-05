import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import React from "react";
import { OpenMenu } from "../OpenMenu/OpenMenu";
import { useMenu } from "../../../../../../hooks";

export const OpenListItem = () => {
  const { anchorEl, onClose, onOpen, open } = useMenu();

  return (
    <React.Fragment>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <FolderOpenIcon />
        </ListItemIcon>

        <ListItemText primary="Open" />
      </ListItem>

      <OpenMenu anchorEl={anchorEl} onClose={onClose} open={open} />
    </React.Fragment>
  );
};
