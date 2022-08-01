import React from "react";

import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";

import { useDialog } from "hooks";

import { ExampleImageDialog } from "../ExampleImageDialog";

type OpenExampleImageMenuItemProps = {
  popupState: any;
};

export const OpenExampleImageMenuItem = ({
  popupState,
}: OpenExampleImageMenuItemProps) => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <MenuItem onClick={onOpen}>
      <ListItemText primary="Open example image" />
      <ExampleImageDialog
        onClose={() => {
          onClose();

          popupState.close();
        }}
        open={open}
      />
    </MenuItem>
  );
};
