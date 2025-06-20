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
} from "@mui/material";
import {
  Close,
  PlayCircleOutline,
  Stop,
  ErrorOutline,
} from "@mui/icons-material";

import { useDialog } from "hooks";
import { useFitClassifier } from "../../../hooks";
import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";
import { FitClassifierProgressBar } from "./FitClassifierProgressBar";

import { classifierSlice } from "store/classifier";
import { selectShowClearPredictionsWarning } from "store/classifier/selectors";
import { selectClassifierModel } from "store/classifier/reselectors";

import { APPLICATION_COLORS } from "utils/constants";
import { ModelStatus } from "utils/models/enums";
import { useClassifierHistory } from "views/ProjectViewer/contexts/ClassifierHistoryProvider";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";
import { TooltipWithDisable } from "components/ui/tooltips/TooltipWithDisable";

type FitClassifierDialogAppBarProps = {
  closeDialog: any;
};

export const FitClassifierDialogAppBar = ({
  closeDialog,
}: FitClassifierDialogAppBarProps) => {
  const dispatch = useDispatch();
  const selectedModel = useSelector(selectClassifierModel);
  const showClearPredictionsWarning = useSelector(
    selectShowClearPredictionsWarning,
  );
  const { currentEpoch, totalEpochs } = useClassifierHistory();
  const {
    isReady,
    modelStatus,
    setModelStatus,
    shouldWarnClearPredictions,
    clearPredictions,
    error,
  } = useClassifierStatus();

  const { onClose, onOpen, open } = useDialog();

  const fitClassifier = useFitClassifier();

  const showProgressBar = useMemo(() => {
    switch (modelStatus) {
      case ModelStatus.Loading:
      case ModelStatus.Training:
        return true;
      default:
        return false;
    }
  }, [modelStatus]);

  const onStopFitting = () => {
    if (modelStatus !== ModelStatus.Training || !selectedModel) return;

    selectedModel.stopTraining();

    setModelStatus(ModelStatus.Idle);
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
    </AppBar>
  );
};
