import React from "react";
import { useSelector } from "react-redux";
import { Box, Divider, IconButton, List, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { AppBarOffset } from "components/UI_/AppBarOffset";
import { DividerHeader } from "components/UI_/DividerHeader";
import { BaseAppDrawer } from "components/layout";
import { ExportAnnotationsListItem } from "components/file-io";
import { CreateKindDialog } from "components/dialogs";
import { ImageViewerAppBar } from "../ImageViewerAppBar";
import { ImageViewerCategories } from "../components";
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
        <Box display="flex" alignItems="center" my={1}>
          <Box
            sx={(theme) => ({
              height: 0,
              borderBottom: `thin solid ${theme.palette.divider}`,
              width: "7%",
            })}
          />
          <Typography
            sx={{
              //reapply formatting of DividerHeader
              margin: 0,
              pl: "calc(8px* 1.2)",
              pr: "calc(8px* 1.2)",
              fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
              fontWeight: "400",
              fontSize: "0.875rem",
              lineHeight: "1.43",
              letterSpacing: "0.01071em",
              textTransform: "uppercase",
            }}
          >
            Kinds
          </Typography>
          <Box
            sx={(theme) => ({
              height: 0,
              borderBottom: `thin solid ${theme.palette.divider}`,
              flexGrow: 1,
            })}
          />
          <IconButton
            disableRipple
            sx={(theme) => ({
              p: 0,
              pl: "calc(8px* 1.2)",
              pr: "calc(8px* 1.2)",
              "&:hover": { color: theme.palette.primary.main },
            })}
            onClick={handleOpenCreateKindDialog}
          >
            <Add fontSize="small" />
          </IconButton>
          <Box
            sx={(theme) => ({
              height: 0,
              borderBottom: `thin solid ${theme.palette.divider}`,
              width: "5%",
            })}
          />
        </Box>

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
