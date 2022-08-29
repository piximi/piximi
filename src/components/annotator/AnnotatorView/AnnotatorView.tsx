import React, { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";

import { AppBar, Box, CssBaseline } from "@mui/material";

import { useUpload } from "hooks";

import { AnnotatorDrawer } from "../AnnotatorDrawer";
import { ImageContent } from "../ImageContent";
import { ToolOptions } from "../ToolOptions";
import { Tools } from "../Tools";

import { FallBackDialog } from "components/common/FallBackDialog/FallBackDialog";
import { ImageShapeDialog } from "components/common/ImageShapeDialog/ImageShapeDialog";
import { AlertDialog } from "components/common/AlertDialog/AlertDialog";

import { alertStateSelector, applicationSlice } from "store/application";
import { imageViewerSlice } from "store/image-viewer";

import { AlertType, ImageType } from "types";

import { getStackTraceFromError } from "utils";

import { APPLICATION_COLORS } from "colorPalette";

type AnnotatorViewProps = {
  image?: ImageType;
};

export const AnnotatorView = ({ image }: AnnotatorViewProps) => {
  const dispatch = useDispatch();

  const [files, setFiles] = useState<FileList>();

  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);

  const handleClose = () => {
    setOpenDimensionsDialogBox(false);
  };

  const alertState = useSelector(alertStateSelector);

  const onUnload = (e: any) => {
    if (process.env.NODE_ENV === "development") {
      return;
    } else {
      e.preventDefault();
      return (e.returnValue = "Are you sure you want to exit?");
    }
  };

  const handleError = useCallback(
    async (e: any) => {
      e.preventDefault();
      var error = e.error as Error;
      const stackTrace = await getStackTraceFromError(error);
      dispatch(
        applicationSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Error,
            name: error.name,
            description: error.message,
            stackTrace: stackTrace,
          },
        })
      );
    },
    [dispatch]
  );

  const handleUncaughtRejection = useCallback(
    async (e: any) => {
      e.preventDefault();
      dispatch(
        applicationSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Error,
            name: "Uncaught promise rejection",
            description: String(e.reason.message),
            stackTrace: String(e.reason.stack),
          },
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

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

  useEffect(() => {
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUncaughtRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUncaughtRejection);
    };
  }, [handleError, handleUncaughtRejection]);

  return (
    <ErrorBoundary FallbackComponent={FallBackDialog}>
      <Box sx={{ display: "flex" }}>
        {alertState.visible && (
          <AppBar
            sx={{
              borderBottom: `1px solid ${APPLICATION_COLORS.borderColor}`,
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
    </ErrorBoundary>
  );
};
