import React from "react";

import { Menu, MenuItem } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { HotkeyView } from "types";
import { ExampleProjectDialogNew } from "components/dialogs/ExampleProjectDialog/ExampleProjectDialogNew";
import { OpenProjectMenuItemNew } from "../OpenProjectMenuItem/OpenProjectMenuItemNew";

type OpenProjectMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
};

export const OpenProjectMenuNew = ({
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
      <OpenProjectMenuItemNew onMenuClose={onClose} />
      <MenuItem onClick={onExampleProjectDialog} dense>
        Example Project
      </MenuItem>

      <ExampleProjectDialogNew
        onClose={onMenuDialogClose(onCloseExampleProjectDialog)}
        open={openExampleProject}
      />
    </Menu>
  );
};
