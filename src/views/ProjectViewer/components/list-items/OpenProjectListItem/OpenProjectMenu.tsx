import React from "react";
import { Menu, MenuItem } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { ExampleProjectDialog } from "../../dialogs";
import { OpenProjectMenuItem } from "./OpenProjectMenuItem";

import { HotkeyContext } from "utils/enums";
import { useConfirmReplaceDialog } from "views/ProjectViewer/hooks/useConfirmReplaceProjectDialog";

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
    onClose: handleCloseCloseExampleProjectDialog,
    onOpen: handleOpenExampleProjectDialog,
    open: ExampleProjectOpen,
  } = useDialogHotkey(HotkeyContext.ExampleProjectDialog);
  const { getConfirmation } = useConfirmReplaceDialog();

  const handleCloseDialog = () => {
    handleCloseCloseExampleProjectDialog();
    onClose();
  };

  const handleConfirmedOpenExampleProjectDialog = async () => {
    const confirmation = await getConfirmation({});
    if (!confirmation) return;
    handleOpenExampleProjectDialog();
  };

  return (
    <>
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
        <MenuItem onClick={handleConfirmedOpenExampleProjectDialog} dense>
          Example Project
        </MenuItem>
      </Menu>
      <ExampleProjectDialog
        onClose={handleCloseDialog}
        open={ExampleProjectOpen}
      />
    </>
  );
};
