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
  segmenterModelSelector,
  segmenterModelStatusSelector,
  segmenterSlice,
} from "store/segmenter";
import { ModelStatus } from "types/ModelType";
import { LayersModel } from "@tensorflow/tfjs";

type FitSegmenterDialogAppBarProps = {
  closeDialog: any;
  fit: any;
  disableFitting: boolean;
  epochs: number;
  currentEpoch: number;
};

export const FitSegmenterDialogAppBar = ({
  closeDialog,
  fit,
  disableFitting,
  epochs,
  currentEpoch,
}: FitSegmenterDialogAppBarProps) => {
  const dispatch = useDispatch();

  const selectedModel = useSelector(segmenterModelSelector);
  const modelStatus = useSelector(segmenterModelStatusSelector);

  const onStopFitting = () => {
    if (modelStatus !== ModelStatus.Training) return;
    // TODO - segmenter: move into model class
    (selectedModel._model! as LayersModel).stopTraining = true;
    // TODO - segmenter: Trained or back to Loaded, or some halfway thing?
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
              disableFitting
                ? "Please annotate images before fitting a model."
                : "Fit the model"
            }
            placement="bottom"
          >
            <span>
              <Button
                variant="outlined"
                onClick={fit}
                disabled={disableFitting}
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
