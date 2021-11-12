import React from "react";
import { ListItem, ListItemText } from "@mui/material";
import { useDialog } from "../../hooks";
import { ClassifierDialog } from "../ClassifierDialog";

export const ClassifierListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemText primary="Classifier" />
      </ListItem>
      <ClassifierDialog
        openedDialog={open}
        openedDrawer={true}
        closeDialog={onClose}
      />
    </>
  );
};
