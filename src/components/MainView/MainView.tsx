import React, { useEffect, useState, useCallback } from "react";
import { ApplicationDrawer } from "../ApplicationDrawer";
import { ImageGrid } from "../ImageGrid";
import { ApplicationAppBar } from "../ApplicationAppBar";
import { Box, CssBaseline } from "@mui/material";
import { ImageShapeDialog } from "../annotator/CategoriesList/OpenMenu/ImageShapeDialog";
import { applicationSlice } from "store/slices/applicationSlice";
import { useHotkeys } from "react-hotkeys-hook";
import { useDispatch, useSelector } from "react-redux";
import { visibleImagesSelector } from "store/selectors";
import { ImageType } from "../../types/ImageType";
import { ErrorBoundary } from "react-error-boundary";
import { AlertType } from "types/AlertStateType";
import { FallBackDialog } from "components/common/FallBackDialog/FallBackDialog";
import { getStackTraceFromError } from "utils/getStackTrace";
import { useUpload } from "hooks/useUpload/useUpload";

export const MainView = () => {
  const dispatch = useDispatch();

  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);

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
    await uploadFiles(files);
    setFiles(files);
  };

  const images = useSelector(visibleImagesSelector);
  const selectAllImages = () => {
    const newSelected = images.map((image: ImageType) => image.id);
    dispatch(applicationSlice.actions.selectAllImages({ ids: newSelected }));
  };

  const selectAllImagesHotkeyRef = useHotkeys(
    "control+a",
    () => selectAllImages(),
    [images]
  ) as React.MutableRefObject<HTMLDivElement>;

  return (
    <div>
      <ErrorBoundary FallbackComponent={FallBackDialog}>
        <div ref={selectAllImagesHotkeyRef} tabIndex={-1}>
          <Box sx={{ height: "100vh" }}>
            <CssBaseline />

            <ApplicationAppBar />

            <ApplicationDrawer />

            <ImageGrid onDrop={onDrop} />

            {files?.length && (
              <ImageShapeDialog
                files={files}
                open={openDimensionsDialogBox}
                onClose={handleClose}
                isUploadedFromAnnotator={false}
              />
            )}
          </Box>
        </div>
      </ErrorBoundary>
    </div>
  );
};
