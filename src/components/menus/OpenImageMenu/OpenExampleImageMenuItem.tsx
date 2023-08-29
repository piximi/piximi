import React from "react";

import { MenuItem, ListItemText } from "@mui/material";

import { useDialog } from "hooks";

import { ExampleImageDialog } from "components/dialogs";

type OpenExampleImageMenuItemProps = {
  onCloseMenu: () => void;
};

export const OpenExampleImageMenuItem = ({
  onCloseMenu,
}: OpenExampleImageMenuItemProps) => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <MenuItem onClick={onOpen}>
      <ListItemText primary="Open example image" />
      <ExampleImageDialog
        onClose={() => {
          onClose();

          onCloseMenu();
        }}
        open={open}
      />
    </MenuItem>
  );
};
