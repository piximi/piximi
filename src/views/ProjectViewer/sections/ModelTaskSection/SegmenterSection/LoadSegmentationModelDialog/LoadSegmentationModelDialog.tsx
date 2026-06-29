import type React from "react";
import { useCallback, useEffect, useState } from "react";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import { useHotkeys } from "hooks";

import type { Shape } from "store/dataV2/types";

import { useSegmenterApi } from "utils/dl/segmentation";
import { HotkeyContext } from "utils/enums";
import type { SegmentaionModelDetails } from "utils/dl/segmentation/types";

import { PretrainedModelSelector } from "./PretrainedModelSelector";

type LoadSegmentationModelDialogProps = {
  onClose: () => void;
  loadedModel?: SegmentaionModelDetails;
  open: boolean;
  dispatchFunction: (
    model: SegmentaionModelDetails,
    inputShape: Shape,
  ) => Promise<void>;
};

export const LoadSegmentationModelDialog = ({
  onClose,
  loadedModel,
  open,
  dispatchFunction,
}: LoadSegmentationModelDialogProps) => {
  const [selectedModel, setSelectedModel] = useState<
    SegmentaionModelDetails | undefined
  >(loadedModel);
  const [inputShape, _setInputShape] = useState<Shape>({
    height: 256,
    width: 256,
    channels: 3,
    planes: 1,
  });

  const [pretrainedModels, setPretrainedModels] = useState<
    Array<SegmentaionModelDetails>
  >([]);

  const segApi = useSegmenterApi();

  const onModelChange = useCallback(
    (model: SegmentaionModelDetails | undefined) => {
      setSelectedModel(model);
    },
    [],
  );

  const dispatchModelToStore = async () => {
    if (!selectedModel) {
      import.meta.env.NODE_ENV !== "production" &&
        console.warn("Attempting to dispatch undefined model");
      return;
    }

    await dispatchFunction(selectedModel, inputShape);

    onClose();
  };

  const closeDialog = () => {
    setSelectedModel(loadedModel);
    onClose();
  };

  useHotkeys(
    "enter",
    () => {
      selectedModel && dispatchModelToStore();
    },
    HotkeyContext.ConfirmationDialog,

    [dispatchModelToStore, selectedModel],
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
            setModel={onModelChange}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog} color="primary">
          Cancel
        </Button>

        <Button
          onClick={dispatchModelToStore}
          color="primary"
          disabled={!selectedModel}
        >
          Open Segmentation model
        </Button>
      </DialogActions>
    </Dialog>
  );
};
