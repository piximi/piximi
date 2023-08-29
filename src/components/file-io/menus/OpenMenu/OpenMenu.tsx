import React from "react";

import { Menu, MenuItem, MenuList } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { OpenProjectMenuItem } from "../OpenProjectMenuItem";
import { OpenExampleProjectDialog } from "components/dialogs";

import { HotkeyView } from "types";

type OpenMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
};

export const OpenMenu = ({ anchorEl, onClose, open }: OpenMenuProps) => {
  const {
    onClose: onCloseExampleProjectDialog,
    onOpen: onOpenExampleProjectDialog,
    open: openExampleProject,
  } = useDialogHotkey(HotkeyView.ExampleClassifierDialog);

  const onMenuDialogClose = (onDialogClose: () => void) => {
    return () => {
      onDialogClose();
      onClose();
    };
  };

  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuList dense variant="menu">
        <OpenProjectMenuItem onMenuClose={onClose} />
        <MenuItem onClick={onOpenExampleProjectDialog}>
          Open example project
        </MenuItem>
      </MenuList>

      <OpenExampleProjectDialog
        onClose={onMenuDialogClose(onCloseExampleProjectDialog)}
        open={openExampleProject}
      />
    </Menu>
  );
};
