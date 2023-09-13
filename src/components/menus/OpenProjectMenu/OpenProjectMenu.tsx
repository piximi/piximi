import React from "react";

import { Menu, MenuItem } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { OpenProjectMenuItem } from "../OpenProjectMenuItem";
import { ExampleProjectDialog } from "components/dialogs";

import { HotkeyView } from "types";

type OpenProjectMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
};

export const OpenProjectMenu = ({
  anchorEl,
  onClose,
  open,
}: OpenProjectMenuProps) => {
  const {
    onClose: onCloseExampleProjectDialog,
    onOpen: onExampleProjectDialog,
    open: openExampleProject,
  } = useDialogHotkey(HotkeyView.ExampleClassifierDialog);

  const onMenuDialogClose = (onDialogClose: () => void) => {
    return () => {
      onDialogClose();
      onClose();
    };
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
    >
      <OpenProjectMenuItem onMenuClose={onClose} />
      <MenuItem onClick={onExampleProjectDialog} dense>
        Example Project
      </MenuItem>

      <ExampleProjectDialog
        onClose={onMenuDialogClose(onCloseExampleProjectDialog)}
        open={openExampleProject}
      />
    </Menu>
  );
};
