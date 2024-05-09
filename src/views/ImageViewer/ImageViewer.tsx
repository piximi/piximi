import React, { useEffect, useCallback, useState, useRef } from "react";
import Konva from "konva";
import { useDispatch, useSelector } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";
import { AppBar, Box, CssBaseline } from "@mui/material";

import { useMobileView, useUpload } from "hooks";

import { FallBackDialog, ImageShapeDialog } from "components/dialogs";
import { ImageViewerDrawer } from "components/drawers";
import { AlertBar } from "components/app-bars";

import { StageWrapper } from "components/stage/StageWrapper";

import { applicationSettingsSlice } from "store/applicationSettings";

import { StageContext } from "contexts";
import { AnnotatorToolDrawer } from "components/drawers";
import { ImageShapeInfo } from "utils/file-io/types";
import { ImageShapeEnum } from "utils/file-io/enums";
import { APPLICATION_COLORS } from "utils/common/constants";
import { getStackTraceFromError } from "utils/common/helpers";
import { AlertType, HotkeyView } from "utils/common/enums";
import { selectAlertState } from "store/applicationSettings/selectors";

export const ImageViewer = () => {
  const dispatch = useDispatch();
  const stageRef = useRef<Konva.Stage>(null);
  const [files, setFiles] = useState<FileList>();
  const [optionsVisible, setOptionsVisibile] = useState<boolean>(true);
  const [persistOptions, setPersistOptions] = useState<boolean>(false);
  const isMobile = useMobileView();
  const [imageShape, setImageShape] = useState<ImageShapeInfo>({
    shape: ImageShapeEnum.InvalidImage,
  });

  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);
  const uploadFiles = useUpload(setOpenDimensionsDialogBox);
  const alertState = useSelector(selectAlertState);

  const handleClose = () => {
    setOpenDimensionsDialogBox(false);
  };
  const onDrop = async (files: FileList) => {
    const imageShapeInfo = await uploadFiles(files);
    setImageShape(imageShapeInfo);
    setFiles(files);
  };

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
        applicationSettingsSlice.actions.updateAlertState({
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
        applicationSettingsSlice.actions.updateAlertState({
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
    dispatch(
      applicationSettingsSlice.actions.registerHotkeyView({
        hotkeyView: HotkeyView.Annotator,
      })
    );
    return () => {
      dispatch(applicationSettingsSlice.actions.unregisterHotkeyView({}));
    };
  }, [dispatch]);

  useEffect(() => {
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUncaughtRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUncaughtRejection);
    };
  }, [handleError, handleUncaughtRejection]);

  return (
    <StageContext.Provider value={stageRef}>
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
              <AlertBar alertState={alertState} />
            </AppBar>
          )}

          <CssBaseline />
          {isMobile ? <></> : <ImageViewerDrawer />}

          <StageWrapper
            onDrop={onDrop}
            setOptionsVisibility={setOptionsVisibile}
            persistOptions={persistOptions}
          />

          {files?.length && (
            <ImageShapeDialog
              files={files}
              open={openDimensionsDialogBox}
              onClose={handleClose}
              referenceImageShape={imageShape}
            />
          )}

          {isMobile ? (
            <></>
          ) : (
            <AnnotatorToolDrawer
              optionsVisibility={optionsVisible}
              setOptionsVisibility={setOptionsVisibile}
              persistOptions={persistOptions}
              setPersistOptions={setPersistOptions}
            />
          )}
        </Box>
      </ErrorBoundary>
    </StageContext.Provider>
  );
};
