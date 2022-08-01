import React from "react";
import PopupState, { bindTrigger } from "material-ui-popup-state";

import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import DownloadIcon from "@mui/icons-material/Download";

import { SaveMenu } from "components/SaveMenu";

export const SaveListItem = () => {
  return (
    //@ts-ignore
    <PopupState variant="popover">
      {(popupState) => (
        <>
          <ListItem button {...bindTrigger(popupState)}>
            <ListItemIcon>
              <DownloadIcon />
            </ListItemIcon>

            <ListItemText primary="Save" />
          </ListItem>

          <SaveMenu popupState={popupState} />
        </>
      )}
    </PopupState>
  );
};
