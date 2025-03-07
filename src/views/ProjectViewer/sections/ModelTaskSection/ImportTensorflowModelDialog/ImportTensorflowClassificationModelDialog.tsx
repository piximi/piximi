import React, { useCallback, useState } from "react";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tabs,
} from "@mui/material";

import { useHotkeys } from "hooks";

import { LocalFileUpload } from "./LocalFileUpload";
import { CloudUpload } from "./CloudUpload";
import { ModelFormatSelection } from "./ModelFormatSelection";

import { Model } from "utils/models/Model";

import { ModelTask } from "utils/models/enums";
import { HotkeyContext } from "utils/common/enums";

import { Shape } from "store/data/types";
import { ToolTipTab } from "components/layout";

type ImportTensorflowClassificationModelDialogProps = {
  onClose: () => void;
  loadedModel?: Model;
  open: boolean;
  dispatchFunction: (model: Model, inputShape: Shape) => Promise<void>;
};

export const ImportTensorflowClassificationModelDialog = ({
  onClose,
  loadedModel,
  open,
  dispatchFunction,
}: ImportTensorflowClassificationModelDialogProps) => {
  const [selectedModel, setSelectedModel] = useState<Model | undefined>(
    loadedModel?.name === "Fully Convolutional Network"
      ? undefined
      : loadedModel,
  );
  const [inputShape, setInputShape] = useState<Shape>({
    height: 256,
    width: 256,
    channels: 3,
    planes: 1,
  });
  const [isGraph, setIsGraph] = useState(false);

  const [tabVal, setTabVal] = useState("1");
  const [invalidModel, setInvalidModel] = useState(false);

  const onModelChange = useCallback((model: Model | undefined) => {
    setSelectedModel(model);
  }, []);

  const dispatchModelToStore = async () => {
    if (!selectedModel) {
      import.meta.env.NODE_ENV !== "production" &&
        console.warn("Attempting to dispatch undefined model");
      return;
    }

    await dispatchFunction(selectedModel, inputShape);

    setInvalidModel(false);
    onClose();
  };

  const closeDialog = () => {
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

  return (
    <Dialog fullWidth maxWidth="sm" onClose={closeDialog} open={open}>
      <DialogTitle>Load Classification model</DialogTitle>

      <Tabs value={tabVal} variant="fullWidth" onChange={onTabSelect}>
        <ToolTipTab label="Upload Local" value="1" placement="top" />

        <ToolTipTab label="Fetch Remote" value="2" placement="top" />
      </Tabs>
      <DialogContent>
        <Box hidden={tabVal !== "1" && tabVal !== "2"} pb={2}>
          <ModelFormatSelection isGraph={isGraph} setIsGraph={setIsGraph} />
        </Box>

        <Box hidden={tabVal !== "1"}>
          <LocalFileUpload
            modelTask={ModelTask.Classification}
            isGraph={isGraph}
            setModel={onModelChange}
            setInputShape={setInputShape}
          />
        </Box>

        <Box hidden={tabVal !== "2"}>
          <CloudUpload
            modelTask={ModelTask.Classification}
            isGraph={isGraph}
            setModel={onModelChange}
            setInputShape={setInputShape}
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
          Open Classification model
        </Button>
      </DialogActions>
    </Dialog>
  );
};
