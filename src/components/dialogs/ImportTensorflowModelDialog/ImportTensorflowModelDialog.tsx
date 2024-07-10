import React, { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  Tab,
  TabProps,
  Tabs,
  Tooltip,
  TooltipProps,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

import { useHotkeys } from "hooks";

import { LocalFileUpload } from "./LocalFileUpload";
import { PretrainedModelSelector } from "./PretrainedModelSelector";
import { CloudUpload } from "./CloudUpload";

import { Model } from "utils/models/Model/Model";
import { ModelFormatSelection } from "./ModelFormatSelection";
import { Cellpose } from "utils/models/Cellpose";
import { ModelTask } from "utils/models/enums";
import { availableClassifierModels } from "utils/models/availableClassificationModels";
import { availableSegmenterModels } from "utils/models/availableSegmentationModels";
import { HotkeyView } from "utils/common/enums";
import { Shape } from "store/data/types";
import { selectProjectImageChannels } from "store/project/selectors";
import { useSelector } from "react-redux";

const ToolTipTab = (
  props: TabProps & {
    disabledMessage: string;
    placement: TooltipProps["placement"];
  }
) => {
  const {
    label,
    disabled,
    onChange,
    value,
    placement,
    disabledMessage,
    ...rest
  } = props;

  return (
    <Tab
      style={{ pointerEvents: "auto" }}
      value={value}
      label={
        <Tooltip
          title={disabled ? disabledMessage : ""}
          arrow
          placement={placement}
        >
          <span>{label}</span>
        </Tooltip>
      }
      disabled={disabled}
      onChange={onChange}
      {...rest}
    />
  );
};

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
  const projectChannels = useSelector(selectProjectImageChannels);
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
    setInvalidModel(false);
    setSelectedModel(undefined);
    onClose();
  };

  const onTabSelect = (event: React.SyntheticEvent, newValue: string) => {
    setTabVal(newValue);
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
    // if no pretrained models, make sure not on tab 1
    setTabVal((curr) =>
      _pretrainedModels.length === 0 && curr === "1" ? "2" : curr
    );
  }, [modelTask]);

  useEffect(() => {
    if (modelTask === ModelTask.Segmentation) {
      if (selectedModel && selectedModel.requiredChannels !== projectChannels) {
        setInvalidModel(true);
      } else {
        setInvalidModel(false);
      }
    }
  }, [modelTask, projectChannels, selectedModel]);

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
        Load{" "}
        {modelTask === ModelTask.Classification
          ? "Classification"
          : "Segmentation"}{" "}
        model
      </DialogTitle>

      <Tabs value={tabVal} onChange={onTabSelect}>
        <ToolTipTab
          label="Load Pretrained"
          value="1"
          disabledMessage="None Available"
          placement="top"
          disabled={pretrainedModels.length === 0}
        />

        <ToolTipTab
          label="Upload Local"
          value="2"
          disabledMessage="Not Yet Supported"
          placement="top"
          disabled={modelTask === ModelTask.Segmentation}
        />

        <ToolTipTab
          label="Fetch Remote"
          value="3"
          disabledMessage="Not Yet Supported"
          placement="top"
          disabled={modelTask === ModelTask.Segmentation}
        />
      </Tabs>

      <Box hidden={tabVal !== "1"}>
        <PretrainedModelSelector
          values={pretrainedModels}
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

      <Box hidden={tabVal !== "2" && tabVal !== "3"}>
        <ModelFormatSelection isGraph={isGraph} setIsGraph={setIsGraph} />
      </Box>

      <Box hidden={tabVal !== "2"}>
        <LocalFileUpload
          modelTask={modelTask}
          isGraph={isGraph}
          setModel={onModelChange}
          setInputShape={setInputShape}
        />
      </Box>

      <Box hidden={tabVal !== "3"}>
        <CloudUpload
          modelTask={modelTask}
          isGraph={isGraph}
          setModel={onModelChange}
          setInputShape={setInputShape}
        />
      </Box>

      <DialogActions>
        <Button onClick={closeDialog} color="primary">
          Cancel
        </Button>

        <Button
          onClick={dispatchModelToStore}
          color="primary"
          disabled={!selectedModel || invalidModel}
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
