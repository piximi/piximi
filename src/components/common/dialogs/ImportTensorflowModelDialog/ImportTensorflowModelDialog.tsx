import React, { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

import { useHotkeys } from "hooks";

import { LocalFileUpload } from "./LocalFileUpload";
import { PretrainedModelSelector } from "./PretrainedModelSelector";
import { CloudUpload } from "./CloudUpload";

import { HotkeyView, Shape } from "types";
import {
  ModelTask,
  availableClassifierModels,
  availableSegmenterModels,
} from "types/ModelType";
import { Model } from "utils/common/models/Model";
import { ModelFormatSelection } from "./ModelFormatSelection";
import { Cellpose } from "utils/common/models/Cellpose/Cellpose";

type ImportTensorflowModelDialogProps = {
  onClose: () => void;
  open: boolean;
  modelTask: ModelTask;
  dispatchFunction: (model: Model, inputShape: Shape) => void;
};

export const ImportTensorflowModelDialog = ({
  onClose,
  open,
  modelTask,
  dispatchFunction,
}: ImportTensorflowModelDialogProps) => {
  const [selectedModel, setSelectedModel] = useState<Model>();
  const [inputShape, setInputShape] = useState<Shape>({
    height: 256,
    width: 256,
    channels: 3,
    planes: 1,
  });
  const [isGraph, setIsGraph] = useState(false);

  const [pretrainedModels, setPretrainedModels] = useState<Array<Model>>([]);

  const [cloudWarning, setCloudWarning] = useState(false);

  const onModelChange = useCallback((model: Model | undefined) => {
    setSelectedModel(model);
    // TODO - segmenter: generalize to model.cloud
    if (model instanceof Cellpose) {
      setCloudWarning(true);
    } else {
      setCloudWarning(false);
    }
  }, []);

  const dispatchModelToStore = () => {
    if (!selectedModel) {
      process.env.NODE_ENV !== "production" &&
        console.warn("Attempting to dispatch undefined model");
      return;
    }

    dispatchFunction(selectedModel, inputShape);

    closeDialog();
  };

  const closeDialog = () => {
    setCloudWarning(false);
    onClose();
  };

  useHotkeys(
    "enter",
    () => dispatchModelToStore(),
    HotkeyView.ImportTensorflowModelDialog,
    { enableOnTags: ["INPUT"] },
    [dispatchModelToStore]
  );

  useEffect(() => {
    const allModels =
      modelTask === ModelTask.Classification
        ? availableClassifierModels
        : availableSegmenterModels;

    const _pretrainedModels = (allModels as Model[]).filter(
      (m) => m.pretrained
    );

    setPretrainedModels(_pretrainedModels);
  }, [modelTask]);

  return (
    <Dialog fullWidth maxWidth="xs" onClose={closeDialog} open={open}>
      <Collapse in={cloudWarning}>
        <Alert
          severity="warning"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setCloudWarning(false);
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          This model performs inference in the cloud ☁️
        </Alert>
      </Collapse>
      <DialogTitle>
        Import{" "}
        {modelTask === ModelTask.Classification
          ? "Classification"
          : "Segmentation"}{" "}
        model
      </DialogTitle>

      <ModelFormatSelection isGraph={isGraph} setIsGraph={setIsGraph} />

      <LocalFileUpload
        modelTask={modelTask}
        isGraph={isGraph}
        setModel={onModelChange}
        setInputShape={setInputShape}
      />

      <PretrainedModelSelector
        values={pretrainedModels}
        setModel={onModelChange}
      />

      <CloudUpload
        modelTask={modelTask}
        isGraph={isGraph}
        setModel={onModelChange}
        setInputShape={setInputShape}
      />

      <DialogActions>
        <Button onClick={closeDialog} color="primary">
          Cancel
        </Button>

        <Button
          onClick={dispatchModelToStore}
          color="primary"
          disabled={!selectedModel}
        >
          Open{" "}
          {modelTask === ModelTask.Classification
            ? "Classification"
            : "Segmentation"}{" "}
          model
        </Button>
      </DialogActions>
    </Dialog>
  );
};
