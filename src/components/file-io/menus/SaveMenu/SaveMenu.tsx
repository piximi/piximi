import { Menu, MenuItem } from "@mui/material";

import { useDialog } from "hooks";

import { SaveProjectDialog } from "../../dialogs/SaveProjectDialog/SaveProjectDialog";

type SaveMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
};

export const SaveMenu = ({ anchorEl, onClose, open }: SaveMenuProps) => {
  const {
    onClose: onSaveProjectDialogClose,
    onOpen: onSaveProjectDialogOpen,
    open: openSaveProjectDialog,
  } = useDialog();

  const onMenuDialogClose = (onDialogClose: () => void) => {
    return () => {
      onDialogClose();
      onClose();
    };
  };

  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuItem onClick={onSaveProjectDialogOpen}>Save project</MenuItem>

      <SaveProjectDialog
        onClose={onMenuDialogClose(onSaveProjectDialogClose)}
        open={openSaveProjectDialog}
      />
    </Menu>
  );
};
