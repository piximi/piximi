import React, { useState, useEffect } from "react";
import { AppBar, Box, CssBaseline } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { CategoriesList } from "../CategoriesList";
import { ToolOptions } from "../ToolOptions";
import { Tools } from "../Tools";
import { Content } from "../Content";
import { imageViewerSlice } from "../../../store/slices";
import { ImageType } from "../../../types/ImageType";
import { ImageShapeDialog } from "../CategoriesList/OpenMenu/ImageShapeDialog";
import { AlertDialog } from "components/AlertDialog/AlertDialog";
import { alertStateSelector } from "store/selectors/alertStateSelector";
import { useUpload } from "hooks/useUpload/useUpload";

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

  const uploadFiles = useUpload(setOpenDimensionsDialogBox);
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

      <CategoriesList />

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
