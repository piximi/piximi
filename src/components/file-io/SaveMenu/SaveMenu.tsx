import { bindMenu } from "material-ui-popup-state";

import { Menu, MenuItem } from "@mui/material";

import { useDialog } from "hooks";

import { SaveProjectDialog } from "../dialogs/SaveProjectDialog/SaveProjectDialog";
import { SaveClassifierDialog } from "components/classifier/dialogs/SaveClassifierDialog/SaveClassifierDialog";

type SaveMenuProps = {
  popupState: any;
};

export const SaveMenu = ({ popupState }: SaveMenuProps) => {
  const {
    onClose: onSaveProjectDialogClose,
    onOpen: onSaveProjectDialogOpen,
    open: openSaveProjectDialog,
  } = useDialog();

  const {
    onClose: onSaveClassifierDialogClose,
    onOpen: onSaveClassifierDialogOpen,
    open: openSaveClassifierDialog,
  } = useDialog();

  return (
    <Menu {...bindMenu(popupState)}>
      <MenuItem onClick={onSaveProjectDialogOpen}>Save project</MenuItem>

      <MenuItem onClick={onSaveClassifierDialogOpen}>Save classifier</MenuItem>

      <SaveProjectDialog
        onClose={onSaveProjectDialogClose}
        open={openSaveProjectDialog}
        popupState={popupState}
      />

      <SaveClassifierDialog
        onClose={onSaveClassifierDialogClose}
        open={openSaveClassifierDialog}
        popupState={popupState}
      />
    </Menu>
  );
};
