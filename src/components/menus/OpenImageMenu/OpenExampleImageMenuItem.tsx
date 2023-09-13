import React from "react";

import { MenuItem, ListItemText } from "@mui/material";

import { useDialog } from "hooks";

import { ExampleImageDialog } from "components/dialogs";

//TODO: MenuItem??

type OpenExampleImageMenuItemProps = {
  onCloseMenu: () => void;
};

export const OpenExampleImageMenuItem = ({
  onCloseMenu,
}: OpenExampleImageMenuItemProps) => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <MenuItem onClick={onOpen} dense>
      <ListItemText primary="Example Image" />
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
