import { useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useBackend } from "core/backend";
import { generateUUID } from "core/entities";
import { sanitizeOptions } from "core/dl/segmentation/optionUtils";

import { applicationSettingsSlice } from "store/applicationSettings";
import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { taskCancelRegistry } from "store/appTasks/taskCancelRegistry";
import { selectExtendedImages } from "store/data/selectors";

import { getStackTraceFromError } from "utils/logUtils";
import { AlertType } from "utils/enums";

import { selectSelectedImages } from "@ProjectViewer/state/reselectors";

import { useSegmenter } from "./useSegmenter";

import type { AlertState } from "utils/types";

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

  const handleError = useCallback(
    async (error: Error, name: string, taskId: string) => {
      const stackTrace = await getStackTraceFromError(error);
      const errorMessage = `${error.name}:\n${error.message}`;

      const alertState: AlertState = {
        alertType: AlertType.Error,
        name: name,
        description: errorMessage,
        stackTrace: stackTrace,
      };
      if (import.meta.env.NODE_ENV !== "production") {
        console.error(
          alertState.name,
          "\n",
          alertState.description,
          "\n",
          alertState.stackTrace,
        );
      }
      dispatch(
        appTasksSlice.actions.taskFailed({ id: taskId, error: errorMessage }),
      );
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: alertState,
        }),
      );
      setModelStatus("idle");
    },
    [dispatch, setModelStatus],
  );

  const predictSegmenter = async () => {
    if (!loadedModel || error) return;
    const taskId = generateUUID();
    dispatch(
      appTasksSlice.actions.taskRegistered({
        id: taskId,
        type: "image-segmentation",
        progress: 0,
        status: "running",
        label: "Beginning Segmentation",
        cancellable: true,
        startedAt: Date.now(),
      }),
    );
    const controller = new AbortController();
    taskCancelRegistry.register(taskId, async () => {
      controller.abort();
      dispatch(
        appTasksSlice.actions.taskUpdated({
          id: taskId,
          progress: 100,
          status: "stopping",
          label: "Stopping...",
        }),
      );
    });

    const { segmentation } = backend;
    if (!segmentation) {
      await handleError(
        new Error("The connected backend cannot run segmentation"),
        "Segmentation unavailable",
        taskId,
      );
      taskCancelRegistry.unregister(taskId);
      return;
    }

    const inferenceImages =
      selectedImages.length > 0 ? selectedImages : allImages;
    if (inferenceImages.length === 0) {
      await handleError(
        new Error("Inference set is empty"),
        `There are no images to segment.`,
        taskId,
      );
      taskCancelRegistry.unregister(taskId);
      return;
    }

    setModelStatus("predicting");
    try {
      // The backend adds the results itself and announces them as events,
      // which the store sync applies; only the task bookkeeping is here.
      const summary = await segmentation.run(
        {
          modelId: loadedModel.name,
          imageIds: inferenceImages.map((image) => image.id),
          channelMetaIds: channelSelection,
          options: sanitizeOptions(loadedModel.optionSchema, optionValues),
          kindName,
        },
        {
          signal: controller.signal,
          onProgress: ({ percent, message }) =>
            dispatch(
              appTasksSlice.actions.taskUpdated({
                id: taskId,
                progress: percent,
                label: message,
              }),
            ),
        },
      );

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

      if (summary.cancelled) {
        dispatch(appTasksSlice.actions.taskCancelled({ id: taskId }));
      } else {
        dispatch(
          appTasksSlice.actions.taskCompleted({
            id: taskId,
            label:
              summary.skipped > 0
                ? `Segmentation finished: ${summary.added} added, ${summary.skipped} skipped as duplicates`
                : `Segmentation finished: ${summary.added} added`,
          }),
        );
      }
      setModelStatus("idle");
    } catch (error) {
      await handleError(error as Error, "Error in running predictions", taskId);
    } finally {
      taskCancelRegistry.unregister(taskId);
    }
  };
  return predictSegmenter;
};
