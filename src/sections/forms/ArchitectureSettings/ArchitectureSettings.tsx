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

import { ConfirmationDialog } from "components/ConfirmationDialog";
import { useDialogHotkey } from "hooks";
import { Shape } from "store/data/types";
import { HotkeyContext } from "utils/common/enums";

type SelectedModelType = {
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

  const [clearDialogText, setClearDialogText] = useState(
    `Keep ${selectedModel.model.name} training history?`
  );

  const {
    onClose: handleCloseClearDialog,
    open: clearDialogOpen,
    onOpen: handleOpenClearDialog,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const dispatchModelOnExit = () => {
    // "selectedModel" updates before the dialog's onClose() method is called
    // resulting in next model name appearing briefly.
    // This will update the dialog text after closing
    setClearDialogText(`Keep ${selectedModel.model.name} training history?`);
  };

  const handleModelDispatch = (dialogAction: "keep" | "discard") => {
    dispatchModel(dialogAction === "discard", nextModelIdx);
  };

  const handleSelectedModelChange = (event: SelectChangeEvent) => {
    const modelIdx = +event.target.value;
    if (Number.isNaN(modelIdx)) return;
    setNextModelIdx(modelIdx);
    if (selectedModel.model.modelLoaded) {
      handleOpenClearDialog();
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
                dispatchCallBack={(number) =>
                  dispatchShape(number, "shape-rows")
                }
                min={1}
                disabled={!selectedModel.model.trainable}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <CustomNumberTextField
                id="shape-cols"
                label="Input cols"
                value={inputShape.width}
                dispatchCallBack={(number) =>
                  dispatchShape(number, "shape-cols")
                }
                min={1}
                disabled={!selectedModel.model.trainable}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <CustomNumberTextField
                id="shape-channels"
                label="Input channels"
                value={inputShape.channels}
                dispatchCallBack={(number) =>
                  dispatchShape(number, "shape-channels")
                }
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
      <ConfirmationDialog
        title={clearDialogText}
        onClose={handleCloseClearDialog}
        onConfirm={() => handleModelDispatch("keep")}
        onReject={() => handleModelDispatch("discard")}
        confirmText="Keep"
        rejectText="Discard"
        isOpen={clearDialogOpen}
        TransitionComponent={Fade}
        TransitionProps={{ onExited: dispatchModelOnExit }}
      />
    </>
  );
};
