import React, { useCallback, useEffect } from "react";
import { AppBar, Box, CssBaseline } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { CategoriesList } from "../CategoriesList";
import { ToolOptions } from "../ToolOptions";
import { Tools } from "../Tools";
import { Content } from "../Content";
import { applicationSlice, imageViewerSlice } from "../../../store/slices";
import { ImageType } from "../../../types/ImageType";
import { ImageShapeDialog } from "../CategoriesList/OpenMenu/ImageShapeDialog";
import { AlertDialog } from "components/AlertDialog/AlertDialog";
import { alertStateSelector } from "store/selectors/alertStateSelector";
import { getImageShapeInformation, ImageShapeEnum } from "image/imageHelper";

type ImageViewerProps = {
  image?: ImageType;
};

export const ImageViewer = ({ image }: ImageViewerProps) => {
  const dispatch = useDispatch();

  const [files, setFiles] = React.useState<FileList>();

  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] =
    React.useState(false);

  const handleClose = () => {
    setOpenDimensionsDialogBox(false);
  };

  const alertState = useSelector(alertStateSelector);

  useEffect(() => {
    if (image) {
      dispatch(imageViewerSlice.actions.setActiveImage({ imageId: image.id }));
    }
  }, [dispatch, image]);

  const onDrop = useCallback(
    async (item) => {
      if (!item) return;

      const files: FileList = Object.assign([], item.files);

      const imageShapeInfo = await getImageShapeInformation(files[0]);

      if (imageShapeInfo !== ImageShapeEnum.hyperStackImage) {
        dispatch(
          applicationSlice.actions.uploadImages({
            files: files,
            channels: 3,
            slices: 1,
            imageShapeInfo: imageShapeInfo,
            isUploadedFromAnnotator: true,
          })
        );
      } else {
        setOpenDimensionsDialogBox(true);
      }

      setFiles(files);
    },
    [dispatch]
  );

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
