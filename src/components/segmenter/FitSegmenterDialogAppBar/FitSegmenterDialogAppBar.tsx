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
  segmenterCompiledModelSelector,
  segmenterTrainingFlagSelector,
  segmenterSlice,
} from "store/segmenter";
import { APPLICATION_COLORS } from "colorPalette";

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

  const compiled = useSelector(segmenterCompiledModelSelector);
  const training = useSelector(segmenterTrainingFlagSelector);

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
