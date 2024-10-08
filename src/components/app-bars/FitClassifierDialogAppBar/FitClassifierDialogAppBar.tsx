import { useDispatch, useSelector } from "react-redux";

import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Tooltip,
} from "@mui/material";

import { Close, PlayCircleOutline, Stop } from "@mui/icons-material";

import { FitClassifierProgressBar } from "./FitClassifierProgressBar";

import { classifierSlice } from "store/classifier";

import { ModelStatus } from "utils/models/enums";
import { APPLICATION_COLORS } from "utils/common/constants";
import {
  selectClassifierModelStatus,
  selectClassifierSelectedModel,
} from "store/classifier/selectors";

type FitClassifierDialogAppBarProps = {
  closeDialog: any;
  fit: any;
  noLabels: boolean;
  noTrain: boolean;
  epochs: number;
  currentEpoch: number;
};

export const FitClassifierDialogAppBar = ({
  closeDialog,
  fit,
  noLabels,
  noTrain,
  epochs,
  currentEpoch,
}: FitClassifierDialogAppBarProps) => {
  const dispatch = useDispatch();

  const selectedModel = useSelector(selectClassifierSelectedModel);
  const modelStatus = useSelector(selectClassifierModelStatus);

  const onStopFitting = () => {
    if (modelStatus !== ModelStatus.Training) return;

    selectedModel.stopTraining();

    dispatch(
      classifierSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Trained,
      })
    );
  };

  return (
    <AppBar
      sx={{
        position: "sticky",
        backgroundColor: "transparent",
        boxShadow: "none",
        borderBottom: `1px solid ${APPLICATION_COLORS.borderColor}`,
      }}
    >
      <Toolbar>
        <Tooltip title="Close Dialog" placement="bottom">
          <IconButton
            edge="start"
            color="primary"
            onClick={closeDialog}
            aria-label="Close"
            href={""}
          >
            <Close />
          </IconButton>
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />

        {(modelStatus === ModelStatus.InitFit ||
          modelStatus === ModelStatus.Loading ||
          modelStatus === ModelStatus.Training) && (
          <FitClassifierProgressBar
            epochs={epochs}
            currentEpoch={currentEpoch}
          />
        )}

        {(modelStatus === ModelStatus.Uninitialized ||
          modelStatus >= ModelStatus.Trained) && (
          <Tooltip
            title={
              noLabels
                ? "Please label images before fitting a model."
                : noTrain
                ? "Model not trainable"
                : "Fit the model"
            }
            placement="bottom"
          >
            <span>
              <Button
                variant="outlined"
                onClick={fit}
                disabled={noLabels || noTrain}
                startIcon={<PlayCircleOutline />}
              >
                Fit Classifier
              </Button>
            </span>
          </Tooltip>
        )}

        <Tooltip title="Stop fitting the model" placement="bottom">
          <span>
            <IconButton
              onClick={onStopFitting}
              disabled={modelStatus !== ModelStatus.Training}
              color="primary"
            >
              <Stop />
            </IconButton>
          </span>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
