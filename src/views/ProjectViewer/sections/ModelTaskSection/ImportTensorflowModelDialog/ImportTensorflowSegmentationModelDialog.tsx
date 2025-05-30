import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import {
  Alert,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tabs,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

import { useHotkeys } from "hooks";

import { PretrainedModelSelector } from "./PretrainedModelSelector";
import { selectProjectImageChannels } from "store/project/selectors";

import { Model } from "utils/models/Model";
import { Cellpose } from "utils/models/segmentation";

import { availableSegmenterModels } from "utils/models/availableSegmentationModels";
import { HotkeyContext } from "utils/enums";

import { Shape } from "store/data/types";
import { ToolTipTab } from "components/layout";

type ImportTensorflowSegmentationModelDialogProps = {
  onClose: () => void;
  loadedModel?: Model;
  open: boolean;
  dispatchFunction: (model: Model, inputShape: Shape) => Promise<void>;
};

export const ImportTensorflowSegmentationModelDialog = ({
  onClose,
  loadedModel,
  open,
  dispatchFunction,
}: ImportTensorflowSegmentationModelDialogProps) => {
  const projectChannels = useSelector(selectProjectImageChannels);
  const [selectedModel, setSelectedModel] = useState<Model | undefined>(
    loadedModel?.name === "Fully Convolutional Network"
      ? undefined
      : loadedModel,
  );
  const [inputShape, _setInputShape] = useState<Shape>({
    height: 256,
    width: 256,
    channels: 3,
    planes: 1,
  });

  const [pretrainedModels, setPretrainedModels] = useState<Array<Model>>([]);

  const [cloudWarning, setCloudWarning] = useState(false);

  const [tabVal, setTabVal] = useState("1");
  const [invalidModel, setInvalidModel] = useState(false);

  const onModelChange = useCallback((model: Model | undefined) => {
    setSelectedModel(model);
    // TODO - segmenter: generalize to model.cloud
    if (model instanceof Cellpose) {
      setCloudWarning(true);
    } else {
      setCloudWarning(false);
    }
  }, []);

  const dispatchModelToStore = async () => {
    if (!selectedModel) {
      import.meta.env.NODE_ENV !== "production" &&
        console.warn("Attempting to dispatch undefined model");
      return;
    }

    await dispatchFunction(selectedModel, inputShape);

    setCloudWarning(false);
    setInvalidModel(false);
    onClose();
  };

  const closeDialog = () => {
    setCloudWarning(false);
    setInvalidModel(false);
    setSelectedModel(loadedModel);
    onClose();
  };

  const onTabSelect = (event: React.SyntheticEvent, newValue: string) => {
    setTabVal(newValue);
  };

  useHotkeys(
    "enter",
    () => {
      selectedModel && !invalidModel && dispatchModelToStore();
    },
    HotkeyContext.ConfirmationDialog,

    [dispatchModelToStore, selectedModel, invalidModel],
  );

  useEffect(() => {
    const allModels = availableSegmenterModels;

    const _pretrainedModels = (allModels as Model[]).filter(
      (m) => m.pretrained,
    );

    setPretrainedModels(_pretrainedModels);
    // if no pretrained models, make sure not on tab 1
    setTabVal((curr) =>
      _pretrainedModels.length === 0 && curr === "1" ? "2" : curr,
    );
  }, []);

  useEffect(() => {
    if (
      selectedModel &&
      selectedModel.requiredChannels !== undefined &&
      projectChannels !== undefined &&
      selectedModel.requiredChannels !== projectChannels
    ) {
      setInvalidModel(true);
    } else {
      setInvalidModel(false);
    }
  }, [projectChannels, selectedModel]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={closeDialog} open={open}>
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
          This model performs inference in the cloud ☁️; images will leave your
          machine. This requires internet access and may take time. Please
          choose another option if your data is sensitive and should not be
          transmitted.
        </Alert>
      </Collapse>
      <DialogTitle>Load Segmentation model</DialogTitle>

      <Tabs value={tabVal} variant="fullWidth" onChange={onTabSelect}>
        <ToolTipTab label="Load Pretrained" value="1" placement="top" />
      </Tabs>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
          hidden={tabVal !== "1"}
        >
          <PretrainedModelSelector
            values={pretrainedModels}
            initModel={
              selectedModel
                ? pretrainedModels.findIndex(
                    (model) => model.name === selectedModel.name,
                  ) + ""
                : "-1"
            }
            setModel={onModelChange}
            error={invalidModel}
            errorText={
              !selectedModel
                ? "Select a Model"
                : invalidModel
                  ? `Model requires ${selectedModel.requiredChannels}-channel images`
                  : ""
            }
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
          disabled={!selectedModel || invalidModel}
        >
          Open Segmentation model
        </Button>
      </DialogActions>
    </Dialog>
  );
};
