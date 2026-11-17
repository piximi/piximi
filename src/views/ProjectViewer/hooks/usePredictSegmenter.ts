import { useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useBackend } from "core/backend";
import { sanitizeOptions } from "core/dl/segmentation/optionUtils";
import { isTaskCancelledError } from "core/dl/cancel";

import { applicationSettingsSlice } from "store/applicationSettings";
import { selectExtendedImages } from "store/data/selectors";

import { getStackTraceFromError } from "utils/logUtils";
import { AlertType } from "utils/enums";

import { selectSelectedImages } from "@ProjectViewer/state/reselectors";

import { useSegmenter } from "./useSegmenter";

import type { AlertState } from "utils/types";

/*
 * Runs the loaded segmenter on the selection (or every image). The backend
 * owns the run: its job drives the task toast, including cancellation, and
 * its events add the results to the store. Only errors are handled here.
 */
export const usePredictSegmenter = () => {
  const dispatch = useDispatch();
  const backend = useBackend();
  const allImages = useSelector(selectExtendedImages);
  const selectedImages = useSelector(selectSelectedImages);

  const {
    setModelStatus,
    loadedModel,
    channelSelection,
    optionValues,
    error,
    kindName,
  } = useSegmenter();

  const alert = useCallback(
    async (error: Error, name: string) => {
      const alertState: AlertState = {
        alertType: AlertType.Error,
        name,
        description: `${error.name}:\n${error.message}`,
        stackTrace: await getStackTraceFromError(error),
      };
      if (import.meta.env.NODE_ENV !== "production") {
        console.error(alertState.name, "\n", alertState.description);
      }
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({ alertState }),
      );
    },
    [dispatch],
  );

  const predictSegmenter = async () => {
    if (!loadedModel || error) return;
    const { segmentation } = backend;
    if (!segmentation) {
      await alert(
        new Error("The connected backend cannot run segmentation"),
        "Segmentation unavailable",
      );
      return;
    }
    const inferenceImages =
      selectedImages.length > 0 ? selectedImages : allImages;
    if (inferenceImages.length === 0) {
      await alert(
        new Error("Inference set is empty"),
        "There are no images to segment.",
      );
      return;
    }

    setModelStatus("predicting");
    try {
      const summary = await segmentation.run({
        modelId: loadedModel.name,
        imageIds: inferenceImages.map((image) => image.id),
        channelMetaIds: channelSelection,
        options: sanitizeOptions(loadedModel.optionSchema, optionValues),
        kindName,
      });
      for (const warning of summary.warnings ?? []) {
        dispatch(
          applicationSettingsSlice.actions.updateAlertState({
            alertState: {
              alertType: AlertType.Warning,
              name: "Measurement computation failed",
              description: warning,
            },
          }),
        );
      }
    } catch (error) {
      if (!isTaskCancelledError(error)) {
        await alert(error as Error, "Error in running predictions");
      }
    } finally {
      setModelStatus("idle");
    }
  };
  return predictSegmenter;
};
