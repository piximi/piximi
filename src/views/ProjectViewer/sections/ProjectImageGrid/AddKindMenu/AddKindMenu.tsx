import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { MenuItem, Typography } from "@mui/material";

import { useDialogHotkey, useMobileView } from "hooks";

import { BaseMenu } from "components/ui/BaseMenu";
import { CreateKindDialog } from "components/dialogs";

import { projectSlice } from "store/project";
import { selectActiveKindId } from "store/project/selectors";

import { HotkeyContext } from "utils/common/enums";

export const AddKindMenu = ({
  anchor,
  isOpen,
  onClose,
  filteredKinds,
}: {
  anchor: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  filteredKinds: string[];
}) => {
  const dispatch = useDispatch();
  const activeKind = useSelector(selectActiveKindId);
  const isMobile = useMobileView();
  const {
    onOpen: handleOpenCreateKindDialog,
    onClose: handleCloseCreateKindDialog,
    open: isCreateKindDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleUnfilterKind = (kindId: string) => {
    dispatch(projectSlice.actions.removeKindTabFilter({ kindId }));
    dispatch(projectSlice.actions.setActiveKind({ kind: kindId }));
    if (isMobile) {
      dispatch(projectSlice.actions.addKindTabFilter({ kindId: activeKind }));
    }
    onClose();
  };
  const closeActiveKind = () => {
    dispatch(projectSlice.actions.addKindTabFilter({ kindId: activeKind }));
  };
  const handleCloseCreateKindDialogAndMenu = () => {
    handleCloseCreateKindDialog();
    onClose();
  };
  return (
    <>
      <BaseMenu anchorEl={anchor} open={isOpen} onClose={onClose}>
        <MenuItem
          onClick={handleOpenCreateKindDialog}
          sx={(theme) => ({
            display: "flex",
            justifyContent: "space-between",
            pr: theme.spacing(1),
          })}
        >
          <Typography variant="body2">New Kind</Typography>
        </MenuItem>
        {filteredKinds.map((kindId) => (
          <MenuItem
            key={`add-kind-menu-item-${kindId}`}
            onClick={() => handleUnfilterKind(kindId)}
            sx={(theme) => ({
              display: "flex",
              justifyContent: "space-between",
              pr: theme.spacing(1),
            })}
          >
            <Typography variant="body2">{kindId}</Typography>
          </MenuItem>
        ))}
      </BaseMenu>
      <CreateKindDialog
        onClose={handleCloseCreateKindDialogAndMenu}
        open={isCreateKindDialogOpen}
        secondaryAction={isMobile ? closeActiveKind : undefined}
        changesPermanent={true}
      />
    </>
  );
};
