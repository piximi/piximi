import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Box } from "@mui/material";

import { segmenterSlice, selectSegmenterModelStatus } from "store/segmenter";

import { ModelStatus } from "types/ModelType";
import { useDialogHotkey } from "hooks";
import { HotkeyView } from "types";
import { CustomListItem } from "../CustomListItem";
import {
  EvaluateModelButton,
  FitModelButton,
  PredictModelButton,
} from "components/controls";
import { FitSegmenterDialog } from "components/dialogs";

export const SegmenterExecListItem = () => {
  const [disabled, setDisabled] = React.useState<boolean>(true);
  const [helperText, setHelperText] =
    React.useState<string>("No trained model");
  const [waitingForResults, setWaitingForResults] = React.useState(false);

  const dispatch = useDispatch();

  const modelStatus = useSelector(selectSegmenterModelStatus);

  const {
    onClose: handleCloseFitting,
    onOpen: handleOpenFitting,
    open: fittingOpen,
  } = useDialogHotkey(HotkeyView.Segmenter, false);

  const handlePredict = () => {
    dispatch(
      segmenterSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Predicting,
        execSaga: true,
      })
    );
  };

  const handleEvaluate = async () => {
    setWaitingForResults(true);

    dispatch(
      segmenterSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Evaluating,
        execSaga: true,
      })
    );
  };

  useEffect(() => {
    if (modelStatus === ModelStatus.Trained) {
      setDisabled(false);
      return;
    }

    setDisabled(true);

    switch (modelStatus) {
      case ModelStatus.InitFit:
      case ModelStatus.Loading:
      case ModelStatus.Training:
        setHelperText("Disabled during training");
        break;
      case ModelStatus.Evaluating:
        setHelperText("Evaluating...");
        break;
      case ModelStatus.Predicting:
        setHelperText("Predcting...");
        break;
      case ModelStatus.Suggesting:
        setHelperText("Accept/Reject suggested predictions first");
        break;
      default:
        setHelperText("No Trained Model");
    }
  }, [modelStatus]);

  useEffect(() => {
    if (modelStatus === ModelStatus.Trained && waitingForResults) {
      setWaitingForResults(false);
    }
  }, [modelStatus, waitingForResults]);

  return (
    <>
      <CustomListItem
        dense
        primaryText={
          <Box display="flex" justifyContent="space-between">
            <FitModelButton onClick={handleOpenFitting} />
            <PredictModelButton
              disabled={disabled}
              disabledText={helperText}
              onClick={handlePredict}
              modelStatus={modelStatus}
            />
            <EvaluateModelButton
              disabled={disabled}
              modelStatus={modelStatus}
              disabledText={helperText}
              onClick={handleEvaluate}
            />
          </Box>
        }
      />
      <FitSegmenterDialog
        openedDialog={fittingOpen}
        closeDialog={handleCloseFitting}
      />
    </>
  );
};
