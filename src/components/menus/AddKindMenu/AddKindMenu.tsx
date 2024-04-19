import React from "react";
import { BaseMenu } from "../BaseMenu";
import { MenuItem, Typography } from "@mui/material";
import { CreateKindDialog } from "components/dialogs";
import { useDialog } from "hooks";
import { useDispatch } from "react-redux";
import { projectSlice } from "store/project";

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
  const {
    onOpen: handleOpenCreateKindDialog,
    onClose: handleCloseCreateKindDialog,
    open: isCreateKindDialogOpen,
  } = useDialog();

  const handleUnfilterKind = (kindId: string) => {
    dispatch(projectSlice.actions.removeKindTabFilter({ kindId }));
    dispatch(projectSlice.actions.setActiveKind({ kind: kindId }));
    handleCloseCreateKindDialog();
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
        onClose={handleCloseCreateKindDialog}
        open={isCreateKindDialogOpen}
      />
    </>
  );
};
