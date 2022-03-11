import React, { useCallback, useEffect } from "react";
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
import { AlertType } from "types/AlertStateType";

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

  const [showAlertDialogs, setShowAlertDialogs] = React.useState(false);

  const alertState = useSelector(alertStateSelector);

  React.useEffect(() => {
    if (alertState.alertType !== AlertType.None) {
      setShowAlertDialogs(true);
    }
  }, [alertState]);

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
      {showAlertDialogs && (
        <AppBar
          sx={{
            borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            boxShadow: "none",
            zIndex: 2000,
          }}
          color="inherit"
          position="fixed"
        >
          <AlertDialog
            setShowAlertDialog={setShowAlertDialogs}
            alertState={alertState}
          />
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
