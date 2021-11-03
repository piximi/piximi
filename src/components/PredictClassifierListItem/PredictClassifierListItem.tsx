import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import React from "react";
import LabelImportantIcon from "@mui/icons-material/LabelImportant";
import { useDialog } from "../../hooks";
import { PredictClassifierDialog } from "../PredictClassifierDialog";

export const PredictClassifierListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  const onPredictClick = () => {
    onOpen();
  };

  return (
    <>
      <ListItem button onClick={onPredictClick}>
        <ListItemIcon>
          <LabelImportantIcon />
        </ListItemIcon>

        <ListItemText primary="Predict" />
      </ListItem>
      <PredictClassifierDialog
        openedDialog={open}
        openedDrawer={true}
        closeDialog={onClose}
      />
    </>
  );
};
