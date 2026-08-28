import { useMemo } from "react";

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
  Tooltip,
  Icon,
  LinearProgress,
  Typography,
} from "@mui/material";
import {
  Close,
  PlayCircleOutline,
  Stop,
  ErrorOutline,
} from "@mui/icons-material";

import { useClassificationModel, useDialog } from "hooks";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";
import { TooltipWithDisable } from "components/ui/tooltips/TooltipWithDisable";

import { classifierSlice } from "store/classifier";
import { selectModelLifecycleStatus } from "store/classifier/selectors";
import { useClassifierHistory } from "@ProjectViewer/contexts/ClassifierHistoryProvider";
import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";
import { useFitClassifier } from "@ProjectViewer/hooks/useFitClassifier";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import { selectShowClearPredictionsWarning } from "store/applicationSettings/selectors";
import { applicationSettingsSlice } from "store/applicationSettings";
import { useAcceptClearPredictions } from "@ProjectViewer/hooks";

import { APPLICATION_COLORS } from "utils/constants";
import { useClassifierApi } from "utils/dl/classification";

type FitClassifierDialogAppBarProps = {
  closeDialog: any;
};

export const FitClassifierDialogAppBar = ({
  closeDialog,
}: FitClassifierDialogAppBarProps) => {
  const dispatch = useDispatch();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const modelStatus = useParameterizedSelector(
    selectModelLifecycleStatus,
    modelTarget,
  );
  const showClearPredictionsWarning = useSelector(
    selectShowClearPredictionsWarning,
  );

  const cfApi = useClassifierApi();
  const modelConfig = useClassificationModel();
  const { currentEpoch, totalEpochs } = useClassifierHistory();
  const { isReady, shouldWarnClearPredictions, error } = useClassifierStatus();

  const { onClose, onOpen, open } = useDialog();

  const fitClassifier = useFitClassifier();
  const { clearPredictions } = useAcceptClearPredictions();

  const showProgressBar = useMemo(() => {
    switch (modelStatus) {
      case "loading":
      case "training":
        return true;
      default:
        return false;
    }
  }, [modelStatus]);

  const onStopFitting = async () => {
    if (modelStatus !== "training" || !modelConfig) return;

    await cfApi.cancelTraining(modelConfig.name);

    dispatch(
      classifierSlice.actions.setModelStatus({
        targetId: modelTarget,
        status: "idle",
      }),
    );
  };

  const clearAndFit = () => {
    clearPredictions();
    fitClassifier();
  };
  const handleFit = async () => {
    if (shouldWarnClearPredictions) {
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
        {!!error && (
          <Tooltip
            slotProps={{
              tooltip: {
                sx: (theme) => ({
                  backgroundColor: theme.palette.warning.main,
                  fontSize: theme.typography.body2.fontSize,
                  color: theme.palette.getContrastText(
                    theme.palette.warning.main,
                  ),
                  maxWidth: "none",
                }),
              },
            }}
            title={error.message}
          >
            <Icon>
              <ErrorOutline color="warning" />
            </Icon>
          </Tooltip>
        )}

        {showProgressBar ? (
          <FitClassifierProgressBar
            epochs={totalEpochs}
            currentEpoch={currentEpoch}
          />
        ) : (
          <Button
            variant="outlined"
            onClick={handleFit}
            disabled={!isReady}
            startIcon={<PlayCircleOutline />}
            sx={{ mx: 1 }}
          >
            Fit Classifier
          </Button>
        )}

        <TooltipWithDisable title="Stop fitting the model" placement="bottom">
          <IconButton
            onClick={onStopFitting}
            disabled={modelStatus !== "training"}
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
                        applicationSettingsSlice.actions.setShowClearPredictionsWarning(
                          !showClearPredictionsWarning,
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
    </AppBar>
  );
};

type FitClassifierProgressBarProps = {
  epochs: number;
  currentEpoch: number;
};

const FitClassifierProgressBar = ({
  epochs,
  currentEpoch,
}: FitClassifierProgressBarProps) => {
  const progressPercentage = (currentEpoch / epochs) * 100;
  const settingUpTraining = currentEpoch === 0;

  return (
    <div>
      {settingUpTraining ? (
        <div>
          <Box sx={{ width: 200, mr: 5 }}>
            <LinearProgress />
          </Box>
          <Box sx={{ minWidth: 50 }}>
            <Typography variant="body2" color="text.secondary">
              {" "}
              {"Setting up training..."}{" "}
            </Typography>
          </Box>
        </div>
      ) : (
        <div>
          <Box sx={{ width: 200, mr: 5 }}>
            <LinearProgress variant="determinate" value={progressPercentage} />
          </Box>
          <Box sx={{ minWidth: 50 }}>
            <Typography
              variant="body2"
              color="text.secondary"
            >{`Epoch ${currentEpoch} of ${epochs}`}</Typography>
          </Box>
        </div>
      )}
    </div>
  );
};
