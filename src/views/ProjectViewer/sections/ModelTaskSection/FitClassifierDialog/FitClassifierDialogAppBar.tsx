import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from "@mui/material";

import { Close, PlayCircleOutline, Stop } from "@mui/icons-material";

import { useDialog } from "hooks";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";
import { FitClassifierProgressBar } from "./FitClassifierProgressBar";

import { classifierSlice } from "store/classifier";
import { dataSlice } from "store/data";
import { selectShowClearPredictionsWarning } from "store/classifier/selectors";
import {
  selectClassifierFitOptions,
  selectClassifierModel,
  selectClassifierModelNameOrArch,
  selectClassifierStatus,
} from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";

import { APPLICATION_COLORS } from "utils/common/constants";
import { ModelStatus } from "utils/models/enums";
import { AlertType } from "utils/common/enums";
import { AlertBar } from "components/ui";
import { AlertState } from "utils/common/types";
import { selectAlertState } from "store/applicationSettings/selectors";
import { useClassifierHistory } from "views/ProjectViewer/contexts/ClassifierHistoryProvider";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";
import { TooltipWithDisable } from "components/ui/tooltips/TooltipWithDisable";

type FitClassifierDialogAppBarProps = {
  closeDialog: any;
};

const noLabeledThingsAlert: AlertState = {
  alertType: AlertType.Info,
  name: "No labeled images",
  description: "Please label images to train a model.",
};

export const FitClassifierDialogAppBar = ({
  closeDialog,
}: FitClassifierDialogAppBarProps) => {
  const dispatch = useDispatch();
  const activeKindId = useSelector(selectActiveKindId);
  const selectedModel = useSelector(selectClassifierModel);
  const modelStatus = useSelector(selectClassifierStatus);
  const modelNameOrArch = useSelector(selectClassifierModelNameOrArch);
  const showClearPredictionsWarning = useSelector(
    selectShowClearPredictionsWarning,
  );
  const epochs = useSelector(selectClassifierFitOptions).epochs;
  const alertState = useSelector(selectAlertState);
  const [showWarning, setShowWarning] = useState<boolean>(true);
  const { currentEpoch, setCurrentEpoch, epochEndCallback } =
    useClassifierHistory();
  const { isReady, isTraining, shouldClearPredictions, error, newModelName } =
    useClassifierStatus();

  const { onClose, onOpen, open } = useDialog();
  const _handleFit = async (nameOrArch: string | number) => {
    setCurrentEpoch(0);
    if (modelStatus === ModelStatus.Uninitialized) {
      dispatch(
        classifierSlice.actions.updateModelStatus({
          kindId: activeKindId,
          modelStatus: ModelStatus.InitFit,
          onEpochEnd: epochEndCallback,
          nameOrArch,
        }),
      );
    } else {
      dispatch(
        classifierSlice.actions.updateModelStatus({
          kindId: activeKindId,
          modelStatus: ModelStatus.Training,
          onEpochEnd: epochEndCallback,
          nameOrArch,
        }),
      );
    }
  };

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

  const clearAndFit = () => {
    dispatch(
      dataSlice.actions.clearPredictions({
        kind: activeKindId,
      }),
    );
    _handleFit(newModelName);
  };
  const handleFit = async () => {
    if (!shouldClearPredictions) {
      onOpen();
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
        <IconButton
          edge="start"
          color="primary"
          onClick={closeDialog}
          aria-label="Close"
        >
          <Close />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        {isTraining ? (
          <FitClassifierProgressBar
            epochs={epochs}
            currentEpoch={currentEpoch}
          />
        ) : (
          <TooltipWithDisable
            title={error?.message ?? "Fit the model"}
            placement="bottom"
          >
            <Button
              variant="outlined"
              onClick={handleFit}
              disabled={!isReady}
              startIcon={<PlayCircleOutline />}
              sx={{ mr: 1 }}
            >
              Fit Classifier
            </Button>
          </TooltipWithDisable>
        )}

        <TooltipWithDisable title="Stop fitting the model" placement="bottom">
          <IconButton
            onClick={onStopFitting}
            disabled={modelStatus !== ModelStatus.Training}
            color="primary"
          >
            <Stop />
          </IconButton>
        </TooltipWithDisable>
      </Toolbar>
      <ConfirmationDialog
        isOpen={open}
        onClose={onClose}
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
          onClose();
        }}
      />
      {showWarning &&
        noLabeledThingsAlert &&
        (!selectedModel || selectedModel.trainable) && (
          <AlertBar
            setShowAlertBar={setShowWarning}
            alertState={noLabeledThingsAlert}
          />
        )}

      {alertState.visible && <AlertBar alertState={alertState} />}
    </AppBar>
  );
};
