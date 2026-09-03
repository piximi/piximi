import type React from "react";
import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import { useHotkeys } from "hooks";

import { useSegmenterStatus } from "@ProjectViewer/contexts/SegmenterStatusProvider";
import { useSegmenterApi } from "core/dl/segmentation";

import { HotkeyContext } from "utils/enums";

import { PretrainedModelSelector } from "./PretrainedModelSelector";

import type { SegmentaionModelDetails } from "core/dl/segmentation/types";

type LoadSegmentationModelDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const LoadSegmentationModelDialog = ({
  onClose,
  open,
}: LoadSegmentationModelDialogProps) => {
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

    await segApi.loadModel(selectedModel.name);
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
      <DialogTitle>Load Segmentation Model</DialogTitle>

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
