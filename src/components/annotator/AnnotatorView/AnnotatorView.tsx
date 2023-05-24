import React, {
  useEffect,
  useCallback,
  useState,
  createContext,
  useRef,
} from "react";
import Konva from "konva";
import { useDispatch, useSelector } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";
import { AppBar, Box, CssBaseline } from "@mui/material";

import { useUpload } from "hooks";

import {
  FallBackDialog,
  ImageShapeDialog,
  AlertDialog,
} from "components/common/dialogs";

import { StageWrapper } from "../StageWrapper";
import { ToolOptions } from "../ToolOptions";
import { ToolDrawer } from "../ToolDrawer";
import { AnnotatorDrawer } from "../AnnotatorDrawer/AnnotatorDrawer";

import {
  alertStateSelector,
  applicationSlice,
  registerHotkeyView,
  unregisterHotkeyView,
} from "store/application";

import { getStackTraceFromError } from "utils";
import { APPLICATION_COLORS } from "utils/common/colorPalette";
import { ImageShapeInfo, ImageShapeEnum } from "utils/common/image";

import { AlertType, HotkeyView } from "types";

export const StageContext = createContext<React.RefObject<Konva.Stage> | null>(
  null
);

export const AnnotatorView = () => {
  const dispatch = useDispatch();
  const stageRef = useRef<Konva.Stage>(null);
  const [files, setFiles] = useState<FileList>();
  const [optionsVisible, setOptionsVisibile] = useState<boolean>(true);
  const [persistOptions, setPersistOptions] = useState<boolean>(false);

  const [imageShape, setImageShape] = useState<ImageShapeInfo>({
    shape: ImageShapeEnum.InvalidImage,
  });

  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);
  const uploadFiles = useUpload(setOpenDimensionsDialogBox, true);
  const alertState = useSelector(alertStateSelector);

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
    dispatch(registerHotkeyView({ hotkeyView: HotkeyView.Annotator }));
    return () => {
      dispatch(unregisterHotkeyView({}));
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
              <AlertDialog alertState={alertState} />
            </AppBar>
          )}

          <CssBaseline />

          <AnnotatorDrawer />

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
              isUploadedFromAnnotator={true}
              referenceImageShape={imageShape}
            />
          )}

          <ToolOptions optionsVisibility={optionsVisible} />

          <ToolDrawer
            optionsVisibility={optionsVisible}
            setOptionsVisibility={setOptionsVisibile}
            persistOptions={persistOptions}
            setPersistOptions={setPersistOptions}
          />
        </Box>
      </ErrorBoundary>
    </StageContext.Provider>
  );
};
