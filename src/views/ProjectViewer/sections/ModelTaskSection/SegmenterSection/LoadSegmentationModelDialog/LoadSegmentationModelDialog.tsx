import { useState } from "react";

import { useDispatch } from "react-redux";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
} from "@mui/material";

import { useBackend } from "core/backend";
import { isTaskCancelledError } from "core/dl/cancel";

import { useHotkeys } from "hooks";

import { DialogTitleBar } from "components/ui/DialogTitleBar";

import { applicationSettingsSlice } from "store/applicationSettings";

import { AlertType, HotkeyContext } from "utils/enums";
import { getStackTraceFromError } from "utils/logUtils";

import { useSegmenter } from "@ProjectViewer/hooks";

import { PretrainedModelSelector } from "./PretrainedModelSelector";
import { useSegmentationModels } from "./useSegmentationModels";

import type React from "react";

import type { ModelStatus, SegmentationModelDescriptor } from "core/backend";
import type { SegmentationModelDetails } from "core/dl/segmentation/types";

/* What the confirm button offers, given where the model is. */
const loadLabel: Record<ModelStatus, string> = {
  unavailable: "Build & Load",
  building: "Building…",
  ready: "Load Model",
  loaded: "Load Model",
  failed: "Retry",
};

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
  const { models: pretrainedModels, refresh } = useSegmentationModels(open);
  // The live descriptor for the selection: its status moves while the
  // dialog is open (an environment builds, a load fails).
  const selected: SegmentationModelDescriptor | undefined = selectedModel
    ? pretrainedModels.find((model) => model.name === selectedModel.name)
    : undefined;

  const handleModelSelect = (model: SegmentationModelDetails | undefined) => {
    setSelectedModel(model);
  };

  // The backend's model-load job drives the task toast and its cancel
  // control; only the outcome is handled here.
  const handleLoadModel = async () => {
    if (!selectedModel) {
      import.meta.env.NODE_ENV !== "production" &&
        console.warn("Attempting to dispatch undefined model");
      return;
    }
    const { segmentation } = backend;
    if (!segmentation) return;

    try {
      await segmentation.loadModel(selectedModel.name);
    } catch (error) {
      // The list shows why; a backend without push events needs asking.
      void refresh();
      if (isTaskCancelledError(error)) return;
      const description = (error as Error).message;
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
    }

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
          disabled={!selectedModel || selected?.status === "building"}
        >
          {selected ? loadLabel[selected.status] : "Load Model"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
