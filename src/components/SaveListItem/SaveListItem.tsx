import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import SaveIcon from "@material-ui/icons/Save";
import React from "react";
import { useMenu } from "../../hooks";
import { SaveMenu } from "../SaveMenu";
import PopupState, { bindTrigger } from "material-ui-popup-state";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import { OpenMenu } from "../OpenMenu";

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
