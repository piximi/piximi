import { useEffect, useState } from "react";

import { useDispatch } from "react-redux";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
} from "@mui/material";

import { useBackend } from "core/backend";
import { generateUUID } from "core/entities";
import { isTaskCancelledError } from "core/dl/cancel";

import { useHotkeys } from "hooks";

import { DialogTitleBar } from "components/ui/DialogTitleBar";

import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { taskCancelRegistry } from "store/appTasks/taskCancelRegistry";
import { applicationSettingsSlice } from "store/applicationSettings";

import { AlertType, HotkeyContext } from "utils/enums";
import { getStackTraceFromError } from "utils/logUtils";

import { useSegmenter } from "@ProjectViewer/hooks";

import { PretrainedModelSelector } from "./PretrainedModelSelector";

import type React from "react";

import type { SegmentationModelDescriptor } from "core/backend";
import type { SegmentationModelDetails } from "core/dl/segmentation/types";

type LoadSegmentationModelDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const LoadSegmentationModelDialog = ({
  onClose,
  open,
}: LoadSegmentationModelDialogProps) => {
  const dispatch = useDispatch();
  const { loadedModel, setLoadedModel } = useSegmenter();
  const backend = useBackend();

  const [selectedModel, setSelectedModel] = useState<
    SegmentationModelDetails | undefined
  >(loadedModel);
  const [pretrainedModels, setPretrainedModels] = useState<
    Array<SegmentationModelDescriptor>
  >([]);

  const handleModelSelect = (model: SegmentationModelDetails | undefined) => {
    setSelectedModel(model);
  };

  const handleLoadModel = async () => {
    if (!selectedModel) {
      import.meta.env.NODE_ENV !== "production" &&
        console.warn("Attempting to dispatch undefined model");
      return;
    }
    const { segmentation } = backend;
    if (!segmentation) return;

    const taskId = generateUUID();
    dispatch(
      appTasksSlice.actions.taskRegistered({
        id: taskId,
        type: "image-segmentation",
        progress: 0,
        status: "running",
        label: `Loading ${selectedModel.displayName}`,
        // Only offer cancellation where the model's loader honours the signal;
        // otherwise the control shows "Stopping..." and the load finishes anyway.
        cancellable: selectedModel.cancellableLoad,
        startedAt: Date.now(),
      }),
    );
    const onProgress = ({
      percent,
      message,
    }: {
      percent: number;
      message: string;
    }) => {
      dispatch(
        appTasksSlice.actions.taskUpdated({
          id: taskId,
          progress: percent,
          label: message,
        }),
      );
    };
    const controller = new AbortController();
    if (selectedModel.cancellableLoad)
      taskCancelRegistry.register(taskId, async () => {
        dispatch(
          appTasksSlice.actions.taskUpdated({
            id: taskId,
            progress: -1,
            status: "stopping",
            label: "Stopping...",
          }),
        );
        controller.abort();
      });

    try {
      await segmentation.loadModel(selectedModel.name, {
        signal: controller.signal,
        onProgress,
      });
    } catch (error) {
      if (isTaskCancelledError(error)) {
        dispatch(appTasksSlice.actions.taskCancelled({ id: taskId }));
        return;
      }
      const description = (error as Error).message;
      dispatch(
        appTasksSlice.actions.taskFailed({ id: taskId, error: description }),
      );
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Error,
            name: `Could not load ${selectedModel.displayName}`,
            description,
            stackTrace: await getStackTraceFromError(error as Error),
          },
        }),
      );
      // Leave the dialog open so the error stays in context and another model
      // can be chosen without reopening.
      return;
    } finally {
      taskCancelRegistry.unregister(taskId);
    }

    onProgress({ percent: 100, message: "Model Loaded Successfully" });
    dispatch(appTasksSlice.actions.taskCompleted({ id: taskId }));
    setLoadedModel(selectedModel);
    onClose();
  };

  const closeDialog = () => {
    setSelectedModel(loadedModel);
    onClose();
  };

  useHotkeys(
    "enter",
    () => {
      selectedModel && handleLoadModel();
    },
    HotkeyContext.ConfirmationDialog,
  );

  useEffect(() => {
    backend.segmentation
      ?.listModels()
      .then(setPretrainedModels)
      .catch((error) =>
        console.error("[LoadSegmentationModelDialog] listModels", error),
      );
  }, [backend]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={closeDialog} open={open}>
      <DialogTitleBar
        title="Load Segmentation Model"
        closeDialog={closeDialog}
      />

      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <PretrainedModelSelector
            models={pretrainedModels}
            initModel={
              selectedModel
                ? pretrainedModels.findIndex(
                    (model) => model.name === selectedModel.name,
                  ) + ""
                : "-1"
            }
            setModel={handleModelSelect}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleLoadModel}
          color="primary"
          disabled={!selectedModel}
        >
          Load Model
        </Button>
      </DialogActions>
    </Dialog>
  );
};
