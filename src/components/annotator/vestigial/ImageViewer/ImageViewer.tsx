import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { AppBar, Box, CssBaseline } from "@mui/material";

import { useUpload } from "hooks";

import { AnnotatorDrawer } from "../../AnnotatorDrawer";
import { ToolOptions } from "../../ToolOptions";
import { Tools } from "../../Tools";
import { ImageContent } from "../../ImageContent";

import { AlertDialog } from "components/common/AlertDialog/AlertDialog";
import { ImageShapeDialog } from "components/common/ImageShapeDialog/ImageShapeDialog";

import { ImageType } from "types";
import { alertStateSelector } from "store/application";
import { imageViewerSlice } from "store/image-viewer";

type ImageViewerProps = {
  image?: ImageType;
};

export const ImageViewer = ({ image }: ImageViewerProps) => {
  const dispatch = useDispatch();

  const [files, setFiles] = useState<FileList>();

  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);

  const handleClose = () => {
    setOpenDimensionsDialogBox(false);
  };

  const alertState = useSelector(alertStateSelector);

  useEffect(() => {
    if (image) {
      dispatch(imageViewerSlice.actions.setActiveImage({ imageId: image.id }));
    }
  }, [dispatch, image]);

  const uploadFiles = useUpload(setOpenDimensionsDialogBox, true);
  const onDrop = async (files: FileList) => {
    await uploadFiles(files);
    setFiles(files);
  };

  return (
    <Box sx={{ display: "flex" }}>
      {alertState.visible && (
        <AppBar
          sx={{
            borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            boxShadow: "none",
            zIndex: 2000,
          }}
          color="inherit"
          position="fixed"
        >
          <AlertDialog alertState={alertState} />
        </AppBar>
      )}

      <CssBaseline />

      <AnnotatorDrawer />

      <ImageContent onDrop={onDrop} />

      <ImageShapeDialog
        files={files!}
        open={openDimensionsDialogBox}
        onClose={handleClose}
        isUploadedFromAnnotator={true}
      />

      <ToolOptions />

      <Tools />
    </Box>
  );
};
