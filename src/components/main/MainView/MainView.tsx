import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHotkeys } from "hooks";
import { ErrorBoundary } from "react-error-boundary";

import { Box, CssBaseline } from "@mui/material";

import { useUpload } from "hooks";

import { MainDrawer } from "../MainDrawer";
import { MainImageGrid } from "../MainImageGrid";
import { MainAppBar } from "../MainAppBar";

import { ImageShapeDialog } from "components/common/ImageShapeDialog/ImageShapeDialog";
import { FallBackDialog } from "components/common/FallBackDialog/FallBackDialog";

import { applicationSlice } from "store/application";
import { visibleImagesSelector } from "store/common";

import { AlertType, HotkeyView, ImageType } from "types";

import { getStackTraceFromError } from "utils";
import { ImageShapeEnum, ImageShapeInfo } from "utils/common/image";

import { useDefaultImage, DispatchLocation } from "hooks/useDefaultImage";

export const MainView = () => {
  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);
  const [imageShape, setImageShape] = useState<ImageShapeInfo>({
    shape: ImageShapeEnum.InvalidImage,
  });
  const [files, setFiles] = useState<FileList>();

  const dispatch = useDispatch();
  const images = useSelector(visibleImagesSelector);
  useDefaultImage(DispatchLocation.Project);
  const uploadFiles = useUpload(setOpenDimensionsDialogBox, false);

  useHotkeys(
    "control+a",
    () => selectAllImages(),
    [HotkeyView.MainImageGrid, HotkeyView.MainImageGridAppBar],
    [images]
  );

  const handleClose = () => {
    setOpenDimensionsDialogBox(false);
  };

  const handleDrop = async (files: FileList) => {
    const imageShapeInfo = await uploadFiles(files);
    setImageShape(imageShapeInfo);
    setFiles(files);
  };

  const selectAllImages = () => {
    const newSelected = images.map((image: ImageType) => image.id);
    dispatch(applicationSlice.actions.selectAllImages({ ids: newSelected }));
  };

  const handleUnload = (e: any) => {
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
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUncaughtRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUncaughtRejection);
    };
  }, [handleError, handleUncaughtRejection]);

  useEffect(() => {
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  return (
    <div>
      <ErrorBoundary FallbackComponent={FallBackDialog}>
        <div tabIndex={-1}>
          <Box sx={{ height: "100vh" }}>
            <CssBaseline />

            <MainAppBar />

            <MainDrawer />

            <MainImageGrid onDrop={handleDrop} />

            {files?.length && (
              <ImageShapeDialog
                files={files}
                open={openDimensionsDialogBox}
                onClose={handleClose}
                isUploadedFromAnnotator={false}
                referenceImageShape={imageShape}
              />
            )}
          </Box>
        </div>
      </ErrorBoundary>
    </div>
  );
};
