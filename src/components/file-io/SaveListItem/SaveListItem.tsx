import React from "react";

import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";

import { SaveMenu } from "../SaveMenu";
import { useMenu } from "hooks";

export const SaveListItem = () => {
  const { anchorEl, onClose, onOpen, open } = useMenu();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <DownloadIcon />
        </ListItemIcon>

        <ListItemText primary="Save" />
      </ListItem>

      <SaveMenu anchorEl={anchorEl} onClose={onClose} open={open} />
    </>
  );
};
