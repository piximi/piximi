import { useDispatch, useSelector } from "react-redux";

import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Tooltip,
} from "@mui/material";

import { ArrowBack, PlayCircleOutline, Stop } from "@mui/icons-material";

import { FitClassifierProgressBar } from "./FitClassifierProgressBar";

import {
  classifierCompiledSelector,
  classifierTrainingFlagSelector,
  classifierSlice,
} from "store/classifier";

type FitClassifierDialogAppBarProps = {
  closeDialog: any;
  fit: any;
  disableFitting: boolean;
  epochs: number;
  currentEpoch: number;
};

export const FitClassifierDialogAppBar = ({
  closeDialog,
  fit,
  disableFitting,
  epochs,
  currentEpoch,
}: FitClassifierDialogAppBarProps) => {
  const dispatch = useDispatch();

  const compiled = useSelector(classifierCompiledSelector);
  const training = useSelector(classifierTrainingFlagSelector);

  const onStopFitting = () => {
    if (!compiled) return;
    compiled.stopTraining = true;
    dispatch(classifierSlice.actions.updateCompiled({ compiled: compiled }));
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
            <ArrowBack />
          </IconButton>
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />

        {training && (
          <FitClassifierProgressBar
            epochs={epochs}
            currentEpoch={currentEpoch}
          />
        )}

        {!training && (
          <Tooltip
            title={
              disableFitting
                ? "Please label images before fitting a model."
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
                Fit Classifier
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
