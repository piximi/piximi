import React from "react";

import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";

import { SaveProjectMenu } from "components/menus";
import { useMenu } from "hooks";

export const SaveProjectListItem = () => {
  const { anchorEl, onClose, onOpen, open } = useMenu();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <DownloadIcon />
        </ListItemIcon>

        <ListItemText primary="Save" />
      </ListItem>

      <SaveProjectMenu anchorEl={anchorEl} onClose={onClose} open={open} />
    </>
  );
};
