import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import AddIcon from "@material-ui/icons/Add";
import ListItemText from "@material-ui/core/ListItemText";
import React from "react";
import { NewClassifierDialog } from "../NewClassifierDialog";
import { useDialog } from "../../hooks";

export const NewClassifierListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <React.Fragment>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>

        <ListItemText primary="New classifier…" />
      </ListItem>

      <NewClassifierDialog onClose={onClose} open={open} />
    </React.Fragment>
  );
};
