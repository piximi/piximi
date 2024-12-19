import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Divider, IconButton, List } from "@mui/material";
import { Add } from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { AppBarOffset, DividerHeader, FunctionalDivider } from "components/ui";
import { BaseAppDrawer } from "components/layout";
import { CreateKindDialog } from "components/dialogs";
import {
  ImageViewerCategories,
  ExportAnnotationsListItem,
} from "../../components";
import { ImageViewerAppBar } from "../ImageViewerAppBar";
import { ClearAnnotationsGroup } from "./ClearAnnotationsGroup";
import { ImageList } from "./ImageList";

//import { selectCreatedAnnotationCategories } from "store/slices/data";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import {
  selectImagesArray,
  selectKindsArray,
} from "views/ImageViewer/state/annotator/reselectors";

import { HotkeyContext } from "utils/common/enums";
import { Category, Kind } from "store/data/types";

export const ImageViewerDrawer = () => {
  // const createdCategories = useSelector(selectCreatedAnnotationCategories);
  const dispatch = useDispatch();
  const imageViewerImages = useSelector(selectImagesArray);
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
      })
    );
  };

  return (
    <>
      <BaseAppDrawer>
        <ImageViewerAppBar />

        <AppBarOffset />

        <Divider />

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

        <ImageList images={imageViewerImages} />

        <FunctionalDivider
          headerText="Kinds"
          actions={
            <IconButton onClick={handleOpenCreateKindDialog}>
              <Add fontSize="small" />
            </IconButton>
          }
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
    </>
  );
};
