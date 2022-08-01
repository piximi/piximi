import React from "react";

import { Typography } from "@mui/material";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

import { SampleList } from "../SampleList";
import { AnnotationMode } from "../AnnotationMode";
import { InvertAnnotation } from "../InvertAnnotation";

export const SelectionOptions = () => {
  return (
    <>
      <List dense>
        <ListItem>
          <ListItemText>
            <Typography variant="inherit">
              Press the Enter key to confirm an annotation.
            </Typography>
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            <Typography variant="inherit">
              Select an existing annotation with the Pointer tool.
            </Typography>
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            <Typography variant="inherit">
              Press the Backspace or Escape key to remove a selected annotation.
            </Typography>
          </ListItemText>
        </ListItem>
      </List>

      <Divider />

      <AnnotationMode />

      <Divider />

      <InvertAnnotation />

      <Divider />

      <SampleList />
    </>
  );
};
