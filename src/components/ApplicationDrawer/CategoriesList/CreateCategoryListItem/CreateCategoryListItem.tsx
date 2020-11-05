import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import AddIcon from "@material-ui/icons/Add";
import React from "react";
import { CreateCategoryDialog } from "../CreateCategoryDialog";
import { useDialog } from "../../../../hooks";

export const CreateCategoryListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <React.Fragment>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>

        <ListItemText primary="Create category" />
      </ListItem>

      <CreateCategoryDialog onClose={onClose} open={open} />
    </React.Fragment>
  );
};
