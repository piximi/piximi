import { useDispatch, useSelector } from "react-redux";

import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Tooltip,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from "@mui/material";

import { Close, PlayCircleOutline, Stop, Delete } from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";
import { FitClassifierProgressBar } from "./FitClassifierProgressBar";

import { classifierSlice } from "store/classifier";
import { dataSlice } from "store/data";
import {
  selectClassifierModelStatus,
  selectShowClearPredictionsWarning,
} from "store/classifier/selectors";
import { selectClassifierSelectedModel } from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";

import { APPLICATION_COLORS } from "utils/common/constants";
import { ModelStatus } from "utils/models/enums";
import { HotkeyContext } from "utils/common/enums";

type FitClassifierDialogAppBarProps = {
  closeDialog: any;
  fit: any;
  noLabels: boolean;
  hasLabeledInference: boolean;
  noTrain: boolean;
  epochs: number;
  currentEpoch: number;
};

export const FitClassifierDialogAppBar = ({
  closeDialog,
  fit,
  noLabels,
  hasLabeledInference,
  noTrain,
  epochs,
  currentEpoch,
}: FitClassifierDialogAppBarProps) => {
  const dispatch = useDispatch();
  const activeKind = useSelector(selectActiveKindId);
  const selectedModel = useSelector(selectClassifierSelectedModel);
  const modelStatus = useSelector(selectClassifierModelStatus);
  const showClearPredictionsWarning = useSelector(
    selectShowClearPredictionsWarning,
  );

  const {
    open: warningDialogOpen,
    onClose: handleCloseWarningDialog,
    onOpen: handleOpenWarningDialog,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const onStopFitting = () => {
    if (modelStatus !== ModelStatus.Training) return;

    selectedModel.stopTraining();

    dispatch(
      classifierSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Trained,
      }),
    );
  };

  const handleDisposeModel = () => {
    selectedModel.dispose();
    dispatch(
      classifierSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Uninitialized,
      }),
    );
  };

  const clearAndFit = () => {
    dispatch(
      dataSlice.actions.clearPredictions({
        kind: activeKind,
      }),
    );
    fit();
  };
  const handleFit = async () => {
    if (hasLabeledInference && showClearPredictionsWarning) {
      handleOpenWarningDialog();
    } else {
      clearAndFit();
    }
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
                onClick={handleFit}
                disabled={noLabels || noTrain}
                startIcon={<PlayCircleOutline />}
                sx={{ mr: 1 }}
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
        <Tooltip
          title={
            hasLabeledInference
              ? "Clear or accept predictions before disposing"
              : "Dispose the current model"
          }
          placement="bottom"
        >
          <span>
            <IconButton
              onClick={handleDisposeModel}
              disabled={
                modelStatus !== ModelStatus.Trained || hasLabeledInference
              }
              color="primary"
            >
              <Delete />
            </IconButton>
          </span>
        </Tooltip>
      </Toolbar>
      <ConfirmationDialog
        isOpen={warningDialogOpen}
        onClose={handleCloseWarningDialog}
        title="Current predictions will be lost"
        content={
          <Box>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!showClearPredictionsWarning}
                    onChange={() =>
                      dispatch(
                        classifierSlice.actions.updateShowClearPredictionsWarning(
                          {
                            showClearPredictionsWarning:
                              !showClearPredictionsWarning,
                          },
                        ),
                      )
                    }
                  />
                }
                label="Don't show this again"
              />
            </FormGroup>
          </Box>
        }
        onConfirm={() => {
          clearAndFit();
          handleCloseWarningDialog();
        }}
      />
    </AppBar>
  );
};
