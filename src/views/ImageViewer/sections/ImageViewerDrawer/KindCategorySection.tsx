import { Button, IconButton, Stack, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { FunctionalDivider } from "components/ui";
import React, { useMemo } from "react";
import { ImageViewerCategories } from "views/ImageViewer/components";
import { useDialogHotkey } from "hooks";
import { HotkeyContext } from "utils/enums";
import { useDispatch, useSelector } from "react-redux";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { Category, Kind } from "store/data/types";
import { CreateKindDialog } from "components/dialogs";
import { selectKindsArray } from "views/ImageViewer/state/annotator/reselectors";

export const KindCategorySection = () => {
  const dispatch = useDispatch();
  const kinds = useSelector(selectKindsArray);
  const existingKindIds = useMemo(() => kinds.map((kind) => kind.id), [kinds]);
  const {
    onClose: handleCloseCreateKindDialog,
    onOpen: handleOpenCreateKindDialog,
    open: isCreateKindDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const addKind = (kind: Kind, newUnknownCategory: Category) => {
    dispatch(
      annotatorSlice.actions.addKind({
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
