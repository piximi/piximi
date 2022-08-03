import React from "react";
import PopupState, { bindTrigger } from "material-ui-popup-state";

import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

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
