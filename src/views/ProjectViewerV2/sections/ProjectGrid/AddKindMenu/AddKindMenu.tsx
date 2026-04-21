import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { MenuItem, Typography } from "@mui/material";

import { useDialogHotkey, useMobileView } from "hooks";

import { BaseMenu } from "components/ui/BaseMenu";
import { CreateKindDialog } from "components/dialogs";

import { projectSlice } from "@ProjectViewer/state";
import { selectActiveKindId } from "@ProjectViewer/state/selectors";
import { selectKindIds } from "store/dataV2/selectors";

import { HotkeyContext } from "utils/enums";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";
import { AnnotationCategory, Kind } from "store/dataV2/types";

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
  const existingKinds = useSelector(selectKindIds);

  const isMobile = useMobileView();
  const {
    onOpen: handleOpenCreateKindDialog,
    onClose: handleCloseCreateKindDialog,
    open: isCreateKindDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleUnfilterKind = (kindId: string) => {
    dispatch(
      projectSlice.actions.setKindTabVisibility({ kindId, visible: true }),
    );
    dispatch(projectSlice.actions.setActiveKind(kindId));
    if (isMobile) {
      dispatch(
        projectSlice.actions.setKindTabVisibility({
          kindId: activeKind,
          visible: false,
        }),
      );
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
  const addKind = (kind: Kind, newUnknownCategory: AnnotationCategory) => {
    dispatch(
      dataSliceV2.actions.addKind({
        kind: kind,
        category: newUnknownCategory,
      }),
    );
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
        storeDispatch={addKind}
        existingKinds={existingKinds as string[]}
      />
    </>
  );
};
