import React from "react";

import { MenuItem, ListItemText } from "@mui/material";

import { useDialog } from "hooks";

import { ExampleImageDialogNew } from "components/dialogs";

//TODO: MenuItem??

type OpenExampleImageMenuItemProps = {
  onCloseMenu: () => void;
};

export const OpenExampleImageMenuItemNew = ({
  onCloseMenu,
}: OpenExampleImageMenuItemProps) => {
  const { onClose, onOpen, open } = useDialog();

  return (
    <MenuItem onClick={onOpen} dense>
      <ListItemText primary="Example Image" />
      <ExampleImageDialogNew
        onClose={() => {
          onClose();

          onCloseMenu();
        }}
        open={open}
      />
    </MenuItem>
  );
};
