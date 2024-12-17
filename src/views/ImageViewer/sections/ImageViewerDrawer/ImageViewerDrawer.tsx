import React from "react";
import { useSelector } from "react-redux";
import { Divider, IconButton, List } from "@mui/material";
import { Add } from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { AppBarOffset } from "components/ui/AppBarOffset";
import { DividerHeader, FunctionalDivider } from "components/ui/DividerHeader";
import { BaseAppDrawer } from "components/layout";
import { ExportAnnotationsListItem } from "components/file-io";
import { CreateKindDialog } from "components/dialogs";
import { ImageViewerCategories } from "../../components";
import { ImageViewerAppBar } from "../ImageViewerAppBar";
import { ClearAnnotationsGroup } from "./ClearAnnotationsGroup";
import { ImageList } from "./ImageList";

//import { selectCreatedAnnotationCategories } from "store/slices/data";
import { selectImageViewerImages } from "store/imageViewer/reselectors";

import { HotkeyContext } from "utils/common/enums";

export const ImageViewerDrawer = () => {
  // const createdCategories = useSelector(selectCreatedAnnotationCategories);

  const imageViewerImages = useSelector(selectImageViewerImages);
  const {
    onClose: handleCloseCreateKindDialog,
    onOpen: handleOpenCreateKindDialog,
    open: isCreateKindDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

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
      />
    </>
  );
};
