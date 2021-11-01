import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import { ExampleImageDialog } from "../ExampleImageDialog";
import React from "react";
import { useDialog } from "../../../../hooks";

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
