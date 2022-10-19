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
import { ImageShapeEnum, ImageShapeInfo } from "image/utils/imageHelper";

// TOOD: image_data
// temporary hack
import { loadImageAsStack, convertToImage } from "image/utils/imageHelper";
import { projectSlice } from "store/project";
import colorImage from "images/cell-painting.png";

export const MainView = () => {
  const dispatch = useDispatch();

  // TODO: image_data
  // temporary hack
  useEffect(() => {
    fetch(colorImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "cell-painting.png", blob);
        const stackPromise = loadImageAsStack(file);
        stackPromise
          .then((stack) => convertToImage(stack, file.name, undefined, 1, 3))
          .then((image) => {
            dispatch(
              projectSlice.actions.setImages({
                images: [image],
              })
            );
          });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);

  const [imageShape, setImageShape] = useState<ImageShapeInfo>({
    shape: ImageShapeEnum.InvalidImage,
  });

  const handleClose = () => {
    setOpenDimensionsDialogBox(false);
  };

  const [files, setFiles] = useState<FileList>();

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
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUncaughtRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUncaughtRejection);
    };
  }, [handleError, handleUncaughtRejection]);

  useEffect(() => {
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  const uploadFiles = useUpload(setOpenDimensionsDialogBox, false);
  const onDrop = async (files: FileList) => {
    const imageShapeInfo = await uploadFiles(files);
    setImageShape(imageShapeInfo);
    setFiles(files);
  };

  const images = useSelector(visibleImagesSelector);
  const selectAllImages = () => {
    const newSelected = images.map((image: ImageType) => image.id);
    dispatch(applicationSlice.actions.selectAllImages({ ids: newSelected }));
  };

  useHotkeys(
    "control+a",
    () => selectAllImages(),
    [HotkeyView.MainImageGrid, HotkeyView.MainImageGridAppBar],
    [images]
  );

  return (
    <div>
      <ErrorBoundary FallbackComponent={FallBackDialog}>
        <div tabIndex={-1}>
          <Box sx={{ height: "100vh" }}>
            <CssBaseline />

            <MainAppBar />

            <MainDrawer />

            <MainImageGrid onDrop={onDrop} />

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
