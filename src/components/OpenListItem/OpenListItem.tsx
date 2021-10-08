import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import React from "react";
import { OpenMenu } from "../OpenMenu";
import PopupState, { bindTrigger } from "material-ui-popup-state";

export const OpenListItem = () => {
  return (
    //@ts-ignore
    <PopupState variant="popover">
      {(popupState) => (
        <>
          <ListItem button {...bindTrigger(popupState)}>
            <ListItemIcon>
              <FolderOpenIcon />
            </ListItemIcon>

            <ListItemText primary="Open" />
          </ListItem>

          <OpenMenu popupState={popupState} />
        </>
      )}
    </PopupState>
  );
};
