import React from "react";

import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";

import { useMenu } from "hooks";
import { SaveImageMenu } from "components/menus";

export const SaveImageListItem = () => {
  const { anchorEl, onClose, onOpen, open } = useMenu();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <DownloadIcon />
        </ListItemIcon>

        <ListItemText primary="Save" />
      </ListItem>

      <SaveImageMenu anchorEl={anchorEl} onClose={onClose} open={open} />
    </>
  );
};
