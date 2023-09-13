import React, { useEffect, useState } from "react";

import {
  Alert,
  Fade,
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

import { CustomNumberTextField } from "..";

import { DialogWithAction } from "components/dialogs";
import { useDialog } from "hooks";
import { Shape } from "types";

enum ClearOptions {
  cancel,
  keep,
  discard,
}

export type SelectedModelType = {
  name: string;
  trainable: boolean;
  requiredChannels?: number;
  modelLoaded: boolean;
};

type ArchitectureSettingsProps = {
  modelOptions: {
    name: string;
    trainable: boolean;
    loaded: boolean;
    idx: number;
  }[];
  inputShape: Shape;
  selectedModel: { idx: number; model: SelectedModelType };
  dispatchModel: (disposePrevious: boolean, modelIdx: number) => void;
  dispatchShape: (value: number, inputID: string) => void;
};

export const ArchitectureSettings = ({
  modelOptions,
  inputShape,
  selectedModel,
  dispatchModel,
  dispatchShape,
}: ArchitectureSettingsProps) => {
  const [nextModelIdx, setNextModelIdx] = useState(0);

  const [fixedNumberOfChannels, setFixedNumberOfChannels] =
    useState<boolean>(false);
  const [fixedNumberOfChannelsHelperText, setFixedNumberOfChannelsHelperText] =
    useState<string>("");

  const [clearModel, setClearModel] = useState(ClearOptions.keep);

  const {
    onClose: onCloseClearDialog,
    open: openClearDialog,
    onOpen: onOpenClearDialog,
  } = useDialog();

  const dispatchModelOnExit = () => {
    if (clearModel !== ClearOptions.cancel) {
      dispatchModel(clearModel === ClearOptions.discard, nextModelIdx);
    }
  };

  const handleClearSelect = (_clearModel: ClearOptions) => {
    onCloseClearDialog();
    // don't call dispatchModel directly here
    // it needs to be triggered on dialog exit
    setClearModel(_clearModel);
  };

  const handleSelectedModelChange = (event: SelectChangeEvent) => {
    const modelIdx = +event.target.value;
    if (Number.isNaN(modelIdx)) return;
    setNextModelIdx(modelIdx);
    if (selectedModel.model.modelLoaded) {
      onOpenClearDialog();
    } else {
      // if not loaded skip the clear dialog
      dispatchModel(false, modelIdx);
    }
  };

  useEffect(() => {
    if (selectedModel.model.requiredChannels) {
      setFixedNumberOfChannels(true);
      setFixedNumberOfChannelsHelperText(
        `${selectedModel.model.name} requires ${selectedModel.model.requiredChannels} channels!`
      );
    } else {
      setFixedNumberOfChannels(false);
      setFixedNumberOfChannelsHelperText("");
    }
  }, [selectedModel]);

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl size="small">
            <FormHelperText>Model architecture</FormHelperText>
            <Select
              value={selectedModel.idx + ""}
              onChange={handleSelectedModelChange}
            >
              {modelOptions.map((model) => {
                return (
                  <MenuItem key={model.idx} value={model.idx}>
                    {model.name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <CustomNumberTextField
                id="shape-rows"
                label="Input rows"
                value={inputShape.height}
                dispatchCallBack={dispatchShape}
                min={1}
                disabled={!selectedModel.model.trainable}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <CustomNumberTextField
                id="shape-cols"
                label="Input cols"
                value={inputShape.width}
                dispatchCallBack={dispatchShape}
                min={1}
                disabled={!selectedModel.model.trainable}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <CustomNumberTextField
                id="shape-channels"
                label="Input channels"
                value={inputShape.channels}
                dispatchCallBack={dispatchShape}
                min={1}
                disabled={
                  fixedNumberOfChannels || !selectedModel.model.trainable
                }
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={3} marginTop={1}>
          {fixedNumberOfChannels && (
            <Alert severity="info">{fixedNumberOfChannelsHelperText}</Alert>
          )}
        </Grid>
      </Grid>
      <DialogWithAction
        title={`Keep ${selectedModel.model.name} training history?`}
        onClose={() => handleClearSelect(ClearOptions.cancel)}
        onConfirm={() => handleClearSelect(ClearOptions.keep)}
        confirmText="Keep"
        onReject={() => handleClearSelect(ClearOptions.discard)}
        rejectText="Discard"
        isOpen={openClearDialog}
        TransitionComponent={Fade}
        TransitionProps={{ onExited: dispatchModelOnExit }}
      />
    </>
  );
};
