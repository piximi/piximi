import React from "react";
import { ListItem, ListItemText } from "@mui/material";

export const AnnotatorListItem = () => {
  const onClick = () => {}; //TODO this should open Annotator dialog box

  return (
    <>
      <ListItem button onClick={onClick}>
        <ListItemText primary="Annotator" />
      </ListItem>
    </>
  );
};
