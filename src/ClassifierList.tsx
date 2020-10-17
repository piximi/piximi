import { CollapsibleList } from "./CollapsibleList";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import AddIcon from "@material-ui/icons/Add";
import ListItemText from "@material-ui/core/ListItemText";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import SaveIcon from "@material-ui/icons/Save";
import React from "react";

export const ClassifierList = () => {
  return (
    <CollapsibleList primary="Classifier">
      <ListItem button disabled>
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>

        <ListItemText primary="Fit" />
      </ListItem>

      <ListItem button disabled>
        <ListItemIcon>
          <FolderOpenIcon />
        </ListItemIcon>

        <ListItemText primary="Evaluate" />
      </ListItem>

      <ListItem button disabled>
        <ListItemIcon>
          <SaveIcon />
        </ListItemIcon>

        <ListItemText primary="Predict" />
      </ListItem>
    </CollapsibleList>
  );
};
