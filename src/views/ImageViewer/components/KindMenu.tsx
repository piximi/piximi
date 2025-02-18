import React from "react";
import { useSelector } from "react-redux";
import { Box, Menu, MenuItem, MenuList, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";

import { renderImageViewerKindName } from "../state/annotator/reselectors";

import { HotkeyContext } from "utils/common/enums";

type KindMenuProps = {
  anchorEl: any;
  onClose: () => void;
  opened: boolean;
  kindId: string;
  deleteKind: (kindId: string) => void;
  clearObjects: (kindId: string) => void;
  onEdit: (kindId: string) => void;
};

export const KindMenu = ({
  anchorEl,
  kindId,
  opened,
  onClose: handleClose,
  onEdit: handleEdit,
  deleteKind,
  clearObjects,
}: KindMenuProps) => {
  const renderKindName = useSelector(renderImageViewerKindName);
  const {
    onClose: handleCloseDeleteKindDialog,
    onOpen: handleOpenDeleteKindDialog,
    open: isDeleteKindDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const {
    onClose: handleCloseDeleteObjectsDialog,
    onOpen: handleOpenDeleteObjectsDialog,
    open: isDeleteObjectsDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleMenuCloseWith = (dialogClose: () => void) => {
    dialogClose();
    handleClose();
  };
  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      onClose={handleClose}
      open={opened}
      transformOrigin={{ horizontal: "left", vertical: "top" }}
      MenuListProps={{ sx: { py: 0 } }}
    >
      <MenuList dense variant="menu" sx={{ py: 0 }}>
        <Box>
          <MenuItem
            onClick={(event) => {
              event.stopPropagation();
              handleEdit(kindId);
            }}
            dense
          >
            <Typography variant="inherit">{"Edit"}</Typography>
          </MenuItem>
          <MenuItem onClick={handleOpenDeleteKindDialog} dense>
            <Typography variant="inherit">{"Delete"}</Typography>
          </MenuItem>
          <MenuItem onClick={handleOpenDeleteObjectsDialog} dense>
            <Typography variant="inherit">{"Clear Objects"}</Typography>
          </MenuItem>
        </Box>
      </MenuList>
      <ConfirmationDialog
        title={`Delete "${renderKindName(kindId)}"`}
        content={`Objects and categories associated with "${renderKindName(kindId)}" will also be deleted.`}
        onConfirm={() => deleteKind(kindId)}
        onClose={() => handleMenuCloseWith(handleCloseDeleteKindDialog)}
        isOpen={isDeleteKindDialogOpen}
      />
      <ConfirmationDialog
        title={`Delete All "${renderKindName(kindId)}" Objects`}
        onConfirm={() => clearObjects(kindId)}
        onClose={() => handleMenuCloseWith(handleCloseDeleteObjectsDialog)}
        isOpen={isDeleteObjectsDialogOpen}
      />
    </Menu>
  );
};
