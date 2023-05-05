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
  classifierModelStatusSelector,
  classifierSelectedModelSelector,
  classifierSlice,
} from "store/classifier";

import { APPLICATION_COLORS } from "utils/common/colorPalette";
<<<<<<< HEAD
import { ModelStatus } from "types/ModelType";
import { LayersModel } from "@tensorflow/tfjs";
||||||| parent of e3786db1 ([wip, mod, opt] Get SimpleCNN back up and running)
=======
import { ModelStatus } from "types/ModelType";
>>>>>>> e3786db1 ([wip, mod, opt] Get SimpleCNN back up and running)

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

  const selectedModel = useSelector(classifierSelectedModelSelector);
  const modelStatus = useSelector(classifierModelStatusSelector);

  const onStopFitting = () => {
<<<<<<< HEAD
    if (modelStatus !== ModelStatus.Training) return;
    // TODO - segmenter: move into model class
    (selectedModel._model! as LayersModel).stopTraining = true;
    // TODO - segmenter: Trained or back to Loaded, or some halfway thing?
    dispatch(
      classifierSlice.actions.updateModelStatus({
        execSaga: true,
        modelStatus: ModelStatus.Trained,
      })
    );
||||||| parent of e3786db1 ([wip, mod, opt] Get SimpleCNN back up and running)
    if (!compiled) return;
    compiled.stopTraining = true;
    dispatch(classifierSlice.actions.updateCompiled({ compiled: compiled }));
=======
    if (modelStatus !== ModelStatus.Training) return;
    selectedModel._model!.stopTraining = true;
    // TODO - segmenter: Trained or back to Loaded, or some halfway thing?
    dispatch(
      classifierSlice.actions.updateModelStatus({
        execSaga: true,
        modelStatus: ModelStatus.Trained,
      })
    );
>>>>>>> e3786db1 ([wip, mod, opt] Get SimpleCNN back up and running)
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
            <ArrowBack />
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
