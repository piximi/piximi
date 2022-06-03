import React, { useCallback } from "react";
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
import { getImageShapeInformation, ImageShapeEnum } from "image/imageHelper";

export const MainView = () => {
  const dispatch = useDispatch();

  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] =
    React.useState(false);

  const handleClose = () => {
    setOpenDimensionsDialogBox(false);
  };

  const [files, setFiles] = React.useState<FileList>();

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

  React.useEffect(() => {
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUncaughtRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUncaughtRejection);
    };
  }, [handleError, handleUncaughtRejection]);

  React.useEffect(() => {
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  const onDrop = useCallback(
    async (files: FileList) => {
      const imageShapeInfo = await getImageShapeInformation(files[0]);

      if (imageShapeInfo === ImageShapeEnum.SingleRGBImage) {
        dispatch(
          applicationSlice.actions.uploadImages({
            files: files,
            channels: 3,
            slices: 1,
            imageShapeInfo: imageShapeInfo,
            isUploadedFromAnnotator: false,
          })
        );
      } else if (imageShapeInfo === ImageShapeEnum.HyperStackImage) {
        setOpenDimensionsDialogBox(true);
      } else if (imageShapeInfo === ImageShapeEnum.InvalidImage) {
        process.env.NODE_ENV !== "production" &&
          console.warn(
            "Could not get shape information from first image in file list"
          );
      } else {
        process.env.NODE_ENV !== "production" &&
          console.warn("Unrecognized ImageShapeEnum value");
      }

      setFiles(files);
    },
    [dispatch]
  );

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

            <ImageShapeDialog
              files={files!}
              open={openDimensionsDialogBox}
              onClose={handleClose}
              isUploadedFromAnnotator={false}
            />
          </Box>
        </div>
      </ErrorBoundary>
    </div>
  );
};
