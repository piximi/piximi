import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { AppBar, Box, CssBaseline } from "@mui/material";

import { useUpload } from "hooks";

import { AnnotatorDrawer } from "../AnnotatorDrawer";
import { ToolOptions } from "../ToolOptions";
import { Tools } from "../Tools";
import { Content } from "../Content";
import { ImageShapeDialog } from "../AnnotatorDrawer/OpenMenu/ImageShapeDialog";

import { AlertDialog } from "components/AlertDialog/AlertDialog";

import { alertStateSelector } from "store/selectors";

import { imageViewerSlice } from "store/slices";

import { ImageType } from "types";

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

      <Content onDrop={onDrop} />

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
