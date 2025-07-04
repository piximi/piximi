import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Divider, IconButton, List } from "@mui/material";
import { Add } from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { DividerHeader, FunctionalDivider } from "components/ui";
import { BaseAppDrawer } from "components/layout";
import { CreateKindDialog } from "components/dialogs";
import {
  ImageViewerCategories,
  ExportAnnotationsListItem,
} from "../../components";
import { ClearAnnotationsGroup } from "./ClearAnnotationsGroup";
import { ImageList } from "./ImageList";

//import { selectCreatedAnnotationCategories } from "store/slices/data";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectKindsArray } from "views/ImageViewer/state/annotator/reselectors";

import { HotkeyContext } from "utils/enums";
import { Category, Kind } from "store/data/types";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const ImageViewerDrawer = () => {
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
    <Box sx={{ display: "flex", flexGrow: 1, gridArea: "action-drawer" }}>
      <BaseAppDrawer>
        <List dense>
          <ExportAnnotationsListItem />
        </List>

        <DividerHeader
          textAlign="left"
          typographyVariant="body2"
          sx={{ my: 1 }}
        >
          Images
        </DividerHeader>

        <ImageList />

        <FunctionalDivider
          headerText="Kinds"
          actions={
            <IconButton
              data-help={HelpItem.CreateKind}
              onClick={handleOpenCreateKindDialog}
            >
              <Add fontSize="small" />
            </IconButton>
          }
          containerStyle={{ marginTop: 1, marginBottom: 0 }}
        />

        <ImageViewerCategories />

        <Divider sx={{ mt: 1 }} />

        <ClearAnnotationsGroup />
      </BaseAppDrawer>
      <CreateKindDialog
        onClose={handleCloseCreateKindDialog}
        open={isCreateKindDialogOpen}
        storeDispatch={addKind}
        existingKinds={existingKindIds}
      />
    </Box>
  );
};
