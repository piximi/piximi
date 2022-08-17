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

import {
  compiledSegmentationModelSelector,
  segmentationTrainingFlagSelector,
  segmenterSlice,
} from "store/segmenter";

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

  const compiled = useSelector(compiledSegmentationModelSelector);
  const training = useSelector(segmentationTrainingFlagSelector);

  const onStopFitting = () => {
    if (!compiled) return;
    compiled.stopTraining = true;
    dispatch(segmenterSlice.actions.updateCompiled({ compiled: compiled }));
  };

  return (
    <AppBar
      sx={{
        position: "sticky",
        backgroundColor: "transparent",
        boxShadow: "none",
        borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
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

        {training && (
          <FitSegmenterProgressBar
            epochs={epochs}
            currentEpoch={currentEpoch}
          />
        )}

        {!training && (
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
              disabled={!training}
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
