import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import React from "react";
import { SaveMenu } from "../SaveMenu";
import PopupState, { bindTrigger } from "material-ui-popup-state";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

export const SaveListItem = () => {
  return (
    //@ts-ignore
    <PopupState variant="popover">
      {(popupState) => (
        <>
          <ListItem button {...bindTrigger(popupState)}>
            <ListItemIcon>
              <FolderOpenIcon />
            </ListItemIcon>

            <ListItemText primary="Save" />
          </ListItem>

          <SaveMenu popupState={popupState} />
        </>
      )}
    </PopupState>
  );
};
