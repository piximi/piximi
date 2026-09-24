import { useEffect, useState } from "react";

import { useDispatch } from "react-redux";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
} from "@mui/material";

import { useSegmenterApi } from "core/dl/segmentation";
import { generateUUID } from "core/entities";

import { useHotkeys } from "hooks";

import { DialogTitleBar } from "components/ui/DialogTitleBar";

import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { taskCancelRegistry } from "store/appTasks/taskCancelRegistry";
import { applicationSettingsSlice } from "store/applicationSettings";

import { AlertType, HotkeyContext } from "utils/enums";
import { getStackTraceFromError } from "utils/logUtils";

import { useSegmenterStatus } from "@ProjectViewer/contexts/SegmenterStatusProvider";

import { PretrainedModelSelector } from "./PretrainedModelSelector";

import type React from "react";

import type { SegmentaionModelDetails } from "core/dl/segmentation/types";

import type { LoadCB } from "utils/types";

type LoadSegmentationModelDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const LoadSegmentationModelDialog = ({
  onClose,
  open,
}: LoadSegmentationModelDialogProps) => {
  const dispatch = useDispatch();
  const { loadedModel, setLoadedModel } = useSegmenterStatus();
  const segApi = useSegmenterApi();

  const [selectedModel, setSelectedModel] = useState<
    SegmentaionModelDetails | undefined
  >(loadedModel);
  const [pretrainedModels, setPretrainedModels] = useState<
    Array<SegmentaionModelDetails>
  >([]);

  const handleModelSelect = (model: SegmentaionModelDetails | undefined) => {
    setSelectedModel(model);
  };

  const handleLoadModel = async () => {
    if (!selectedModel) {
      import.meta.env.NODE_ENV !== "production" &&
        console.warn("Attempting to dispatch undefined model");
      return;
    }
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
    const progressCb: LoadCB = (
      progressPercent: number,
      progressMessage: string,
    ) => {
      dispatch(
        appTasksSlice.actions.taskUpdated({
          id: taskId,
          progress: progressPercent,
          label: progressMessage,
        }),
      );
    };
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
        await segApi.cancelLoadModel(selectedModel.name);
      });

    let result: Awaited<ReturnType<typeof segApi.loadModel>>;
    try {
      result = await segApi.loadModel(selectedModel.name, progressCb);
    } finally {
      taskCancelRegistry.unregister(taskId);
    }

    if (!result.success) {
      if (result.reason.code === "LOAD_CANCELLED") {
        dispatch(appTasksSlice.actions.taskCancelled({ id: taskId }));
        return;
      }
      const description = `${result.reason.code}: ${result.reason.message}`;
      dispatch(
        appTasksSlice.actions.taskFailed({ id: taskId, error: description }),
      );
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Error,
            name: `Could not load ${selectedModel.displayName}`,
            description,
            stackTrace: await getStackTraceFromError(
              result.reason.cause instanceof Error
                ? result.reason.cause
                : new Error(description),
            ),
          },
        }),
      );
      // Leave the dialog open so the error stays in context and another model
      // can be chosen without reopening.
      return;
    }

    progressCb(100, "Model Loaded Successfully");
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

    [handleLoadModel, selectedModel],
  );

  useEffect(() => {
    (async () => {
      const results = await segApi.getAvailableSegmentationModels();
      if (results.success) {
        const availableModels = Object.values(results.data);
        setPretrainedModels(availableModels);
      }
    })();
  }, []);

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
        <Button onClick={closeDialog} color="primary">
          Cancel
        </Button>

        <Button
          onClick={handleLoadModel}
          color="primary"
          disabled={!selectedModel}
        >
          Open Segmentation model
        </Button>
      </DialogActions>
    </Dialog>
  );
};
