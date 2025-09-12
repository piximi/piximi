import { Button, Stack, Typography } from "@mui/material";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import React, { useMemo } from "react";
import { ImageViewerCategories } from "views/ImageViewer/components";
import { useDialogHotkey } from "hooks";
import { HotkeyContext } from "utils/enums";
import { useDispatch, useSelector } from "react-redux";
import { Category, Kind } from "store/data/types";
import { CreateKindDialog } from "components/dialogs";
import { selectAllKinds } from "store/data/selectors";
import { dataSlice } from "store/data";

export const KindCategorySection = () => {
  const dispatch = useDispatch();
  const kinds = useSelector(selectAllKinds);
  const existingKindIds = useMemo(() => kinds.map((kind) => kind.id), [kinds]);
  const {
    onClose: handleCloseCreateKindDialog,
    onOpen: handleOpenCreateKindDialog,
    open: isCreateKindDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const addKind = (kind: Kind, newUnknownCategory: Category) => {
    dispatch(
      dataSlice.actions.addKind({
        kind,
        unknownCategory: newUnknownCategory,
      }),
    );
  };
  return (
    <Stack>
      <Typography
        sx={(theme) => ({
          width: "90%",
          textAlign: "center",
          mx: "auto",
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        Categories
      </Typography>
      <Button
        variant="text"
        data-help={HelpItem.CreateKind}
        onClick={handleOpenCreateKindDialog}
      >
        Add Kind
      </Button>
      <ImageViewerCategories />
      <CreateKindDialog
        onClose={handleCloseCreateKindDialog}
        open={isCreateKindDialogOpen}
        storeDispatch={addKind}
        existingKinds={existingKindIds}
      />
    </Stack>
  );
};
