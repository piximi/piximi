import { useDispatch, useSelector } from "react-redux";

import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  PlayCircleOutline,
  Stop,
} from "@mui/icons-material";

import { FitSegmenterProgressBar } from "./FitSegmenterProgressBar";

import { APPLICATION_COLORS } from "utils/common/colorPalette";
import {
  selectSegmenterModel,
  selectSegmenterModelStatus,
  segmenterSlice,
} from "store/slices/segmenter";
import { ModelStatus } from "types/ModelType";

type FitSegmenterDialogAppBarProps = {
  closeDialog: any;
  fit: any;
  noLabels: boolean;
  noTrain: boolean;
  epochs: number;
  currentEpoch: number;
};

export const FitSegmenterDialogAppBar = ({
  closeDialog,
  fit,
  noLabels,
  noTrain,
  epochs,
  currentEpoch,
}: FitSegmenterDialogAppBarProps) => {
  const dispatch = useDispatch();

  const selectedModel = useSelector(selectSegmenterModel);
  const modelStatus = useSelector(selectSegmenterModelStatus);

  const onStopFitting = () => {
    if (modelStatus !== ModelStatus.Training) return;

    selectedModel.stopTraining();

    dispatch(
      segmenterSlice.actions.updateModelStatus({
        execSaga: true,
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
            <CloseIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />

        {(modelStatus === ModelStatus.InitFit ||
          modelStatus === ModelStatus.Loading ||
          modelStatus === ModelStatus.Training) && (
          <FitSegmenterProgressBar
            epochs={epochs}
            currentEpoch={currentEpoch}
          />
        )}

        {(modelStatus === ModelStatus.Uninitialized ||
          modelStatus >= ModelStatus.Trained) && (
          <Tooltip
            title={
              noLabels
                ? "Please annotate images before fitting a model."
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
                Fit Segmenter
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
