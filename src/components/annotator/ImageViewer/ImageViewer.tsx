import React, { useCallback, useEffect } from "react";
import { Box, CssBaseline } from "@mui/material";
import { useDispatch } from "react-redux";
import { CategoriesList } from "../CategoriesList";
import { ToolOptions } from "../ToolOptions";
import { Tools } from "../Tools";
import { Content } from "../Content";
import { imageViewerSlice } from "../../../store/slices";
import { Image } from "../../../types/Image";
import { ImageShapeDialog } from "../CategoriesList/OpenMenu/ImageShapeDialog";

type ImageViewerProps = {
  image?: Image;
};

export const ImageViewer = ({ image }: ImageViewerProps) => {
  const dispatch = useDispatch();

  const [files, setFiles] = React.useState<FileList>();
  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] =
    React.useState(false);

  const handleClose = () => {
    setOpenDimensionsDialogBox(false);
  };

  //
  // useEffect(() => {
  //   const path =
  //     "https://raw.githubusercontent.com/zaidalyafeai/HostedModels/master/unet-128/model.json";
  //
  //   dispatch(loadLayersModelThunk({ name: "foo", path: path }));
  // });

  useEffect(() => {
    if (image) {
      dispatch(imageViewerSlice.actions.setActiveImage({ image: image.id }));
    }
  }, [dispatch, image]);

  const onDrop = useCallback(async (item) => {
    if (item) {
      setFiles(item.files);
      setOpenDimensionsDialogBox(true); //open dialog box
    }
  }, []);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      <CategoriesList />

      <Content onDrop={onDrop} />

      <ImageShapeDialog
        files={files!}
        open={openDimensionsDialogBox}
        onClose={handleClose}
      />

      <ToolOptions />

      <Tools />
    </Box>
  );
};
