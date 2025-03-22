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
import { selectShowClearPredictionsWarning } from "store/classifier/selectors";
import {
  selectActiveClassifierFitOptions,
  selectActiveClassifierModel,
  selectActiveClassifierModelStatus,
} from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";

import { APPLICATION_COLORS } from "utils/common/constants";
import { ModelStatus } from "utils/models/enums";
import { HotkeyContext } from "utils/common/enums";

type FitClassifierDialogAppBarProps = {
  closeDialog: any;
  fit: any;
  noLabels: boolean;
  hasLabeledInference: boolean;
  trainable: boolean;
  currentEpoch: number;
  modelNameOrArch: string | number;
};

export const FitClassifierDialogAppBar = ({
  closeDialog,
  fit,
  noLabels,
  hasLabeledInference,
  trainable,
  currentEpoch,
  modelNameOrArch,
}: FitClassifierDialogAppBarProps) => {
  const dispatch = useDispatch();
  const activeKindId = useSelector(selectActiveKindId);
  const selectedModel = useSelector(selectActiveClassifierModel);
  const modelStatus = useSelector(selectActiveClassifierModelStatus);
  const showClearPredictionsWarning = useSelector(
    selectShowClearPredictionsWarning,
  );
  const epochs = useSelector(selectActiveClassifierFitOptions).epochs;

  const {
    open: warningDialogOpen,
    onClose: handleCloseWarningDialog,
    onOpen: handleOpenWarningDialog,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const onStopFitting = () => {
    if (modelStatus !== ModelStatus.Training || !selectedModel) return;

    selectedModel.stopTraining();

    dispatch(
      classifierSlice.actions.updateModelStatus({
        kindId: activeKindId,
        modelStatus: ModelStatus.Trained,
        nameOrArch: modelNameOrArch,
      }),
    );
  };

  const handleDisposeModel = () => {
    if (!selectedModel) return;
    selectedModel.dispose();
    dispatch(
      classifierSlice.actions.updateModelStatus({
        kindId: activeKindId,
        modelStatus: ModelStatus.Uninitialized,
        nameOrArch: modelNameOrArch,
      }),
    );
  };

  const clearAndFit = () => {
    dispatch(
      dataSlice.actions.clearPredictions({
        kind: activeKindId,
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
                : !trainable
                  ? "Model not trainable"
                  : "Fit the model"
            }
            placement="bottom"
          >
            <span>
              <Button
                variant="outlined"
                onClick={handleFit}
                disabled={noLabels || !trainable}
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
              ? "Clear or accept predictions before clearing"
              : "Clear the current model"
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
