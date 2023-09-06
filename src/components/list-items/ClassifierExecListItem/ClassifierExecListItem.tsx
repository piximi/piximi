import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Box } from "@mui/material";

import { useDialog, useDialogHotkey } from "hooks";

import { CustomListItem } from "../CustomListItem";
import {
  EvaluateModelButton,
  FitModelButton,
  PredictModelButton,
} from "components/controls";
import {
  EvaluateClassifierDialog,
  FitClassifierDialog,
} from "components/dialogs";

import {
  classifierSlice,
  selectClassifierEvaluationResult,
  selectClassifierModelStatus,
} from "store/classifier";

import { ModelStatus } from "types/ModelType";
import { Category, HotkeyView } from "types";
import { selectCreatedImageCategories } from "store/data";

export const ClassifierExecListItem = () => {
  const [disabled, setDisabled] = React.useState<boolean>(true);
  const [helperText, setHelperText] =
    React.useState<string>("No trained model");
  const [waitingForResults, setWaitingForResults] = React.useState(false);

  const dispatch = useDispatch();

  const modelStatus = useSelector(selectClassifierModelStatus);
  const categories: Category[] = useSelector(selectCreatedImageCategories);
  const evaluationResult = useSelector(selectClassifierEvaluationResult);

  const {
    onClose: handleCloseFitting,
    onOpen: handleOpenFitting,
    open: fittingOpen,
  } = useDialogHotkey(HotkeyView.Classifier, false);
  const {
    onClose: handleCloseEval,
    onOpen: handleOpenEval,
    open: evalOpen,
  } = useDialog();

  const handlePredict = () => {
    dispatch(
      classifierSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Predicting,
        execSaga: true,
      })
    );
  };

  const handleEvaluate = async () => {
    setWaitingForResults(true);

    dispatch(
      classifierSlice.actions.updateModelStatus({
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
      handleOpenEval();
    }
  }, [modelStatus, waitingForResults, handleOpenEval]);

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
      <FitClassifierDialog
        openedDialog={fittingOpen}
        closeDialog={handleCloseFitting}
      />
      <EvaluateClassifierDialog
        openedDialog={evalOpen}
        closeDialog={handleCloseEval}
        confusionMatrix={evaluationResult.confusionMatrix}
        classNames={categories.map((c: Category) => c.name)}
        accuracy={evaluationResult.accuracy}
        crossEntropy={evaluationResult.crossEntropy}
        precision={evaluationResult.precision}
        recall={evaluationResult.recall}
        f1Score={evaluationResult.f1Score}
      />
    </>
  );
};

/*

*/
