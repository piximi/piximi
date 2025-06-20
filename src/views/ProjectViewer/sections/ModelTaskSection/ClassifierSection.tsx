import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  IconButton,
  MenuItem,
  SelectChangeEvent,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDialog, useDialogHotkey } from "hooks";
import { SaveFittedModelDialog } from "components/dialogs";
import { ModelExecButtonGroup } from "./ModelExecButtonGroup";
import { ModelIOButtonGroup } from "./ModelIOButtonGroup";
import { ImportTensorflowClassificationModelDialog } from "./ImportTensorflowModelDialog";
import { FitClassifierDialog } from "./FitClassifierDialog";
import { EvaluateClassifierDialog } from "./EvaluateClassifierDialog";

import { HotkeyContext } from "utils/enums";
import { ModelStatus } from "utils/models/enums";
import {
  selectClassifierEvaluationResult,
  selectClassifierModel,
} from "store/classifier/reselectors";
import { PredictionListItems } from "views/ProjectViewer/components/list-items";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";
import { usePredictClassifier } from "views/ProjectViewer/hooks/usePredictClassifier";
import { useEvaluateClassifier } from "views/ProjectViewer/hooks/useEvaluateClassifier";
import { WithLabel } from "components/inputs";
import classifierHandler from "utils/models/classification/classifierHandler";
import { classifierSlice } from "store/classifier";
import { selectActiveKindId } from "store/project/selectors";
import { StyledSelect } from "components/inputs";
import { TooltipWithDisable } from "components/ui/tooltips/TooltipWithDisable";
import { SequentialClassifier } from "utils/models/classification";
import { selectActiveUnlabeledThingsIds } from "store/project/reselectors";
import { ClassifierErrorReason } from "views/ProjectViewer/contexts/types";

export const ClassifierSection = () => {
  const [waitingForResults, setWaitingForResults] = useState(false);
  const selectedModel = useSelector(selectClassifierModel);
  const evaluationResults = useSelector(selectClassifierEvaluationResult);
  const unlabeledThings = useSelector(selectActiveUnlabeledThingsIds);
  const { modelStatus, error } = useClassifierStatus();
  const predictClassifier = usePredictClassifier();
  const evaluateClassifier = useEvaluateClassifier();

  const {
    onClose: handleCloseEvaluateClassifierDialog,
    onOpen: handleOpenEvaluateClassifierDialog,
    open: evaluateClassifierDialogOpen,
  } = useDialog();

  const {
    onClose: handleCloseImportClassifierDialog,
    onOpen: handleOpenImportClassifierDialog,
    open: ImportClassifierDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);
  const {
    onClose: handleCloseSaveClassifierDialog,
    onOpen: handleOpenSaveClassifierDialog,
    open: SaveClassifierDialogOpen,
  } = useDialog();
  const {
    onClose: handleCloseFitClassifierDialog,
    onOpen: handleOpenFitClassifierDialog,
    open: fitClassifierDialogOpen,
  } = useDialogHotkey(HotkeyContext.ClassifierDialog, false);

  const handlePredict = async () => {
    await predictClassifier();
  };

  const handleEvaluate = async () => {
    if (!selectedModel) return;
    if (selectedModel?.history.history.length > evaluationResults.length)
      await evaluateClassifier();

    handleOpenEvaluateClassifierDialog();
  };

  const execConfig = useMemo(() => {
    const fitText = (() => {
      switch (modelStatus) {
        case ModelStatus.Idle:
        case ModelStatus.Pending:
          return !selectedModel || selectedModel.trainable
            ? "Fit Model"
            : "Model is inference only";
        default:
          return "...busy";
      }
    })();
    const predictText = (() => {
      switch (modelStatus) {
        case ModelStatus.Idle:
          return selectedModel ? "Predict Model" : "No Trained Model";
        case ModelStatus.Predicting:
          return "...Predicting";
        default:
          return "...Pending";
      }
    })();
    const predictionDisabled =
      !selectedModel ||
      !selectedModel.pretrained ||
      modelStatus !== ModelStatus.Idle ||
      unlabeledThings.length === 0 ||
      error?.reason === ClassifierErrorReason.ChannelMismatch;

    const evaluateText = (() => {
      if (selectedModel) {
        return !selectedModel || selectedModel.trainable
          ? modelStatus === ModelStatus.Idle ||
            modelStatus === ModelStatus.Pending
            ? "Evaluate Model"
            : "...Pending"
          : "Cannot evaluate non-trainable models";
      } else {
        return "No Trained Model";
      }
    })();
    return {
      fit: {
        helperText: fitText,
        disabled: !(!selectedModel || selectedModel.trainable),
      },
      predict: { helperText: predictText, disabled: predictionDisabled },
      evaluate: {
        helperText: evaluateText,
        disabled: !selectedModel || !selectedModel.pretrained,
      },
    };
  }, [modelStatus, selectedModel, error]);

  useEffect(() => {
    if (modelStatus === ModelStatus.Trained && waitingForResults) {
      setWaitingForResults(false);
      handleOpenEvaluateClassifierDialog();
    }
  }, [
    modelStatus,
    waitingForResults,
    handleOpenEvaluateClassifierDialog,
    setWaitingForResults,
  ]);

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        px={1}
        gap={1}
      >
        <ModelIOButtonGroup
          hasTrainedModel={!!selectedModel}
          handleImportModel={handleOpenImportClassifierDialog}
          handleSaveModel={handleOpenSaveClassifierDialog}
        />
        <ModelSelection selectedModel={selectedModel} />
        <ModelExecButtonGroup
          modelStatus={modelStatus}
          handleFit={handleOpenFitClassifierDialog}
          handlePredict={handlePredict}
          handleEvaluate={handleEvaluate}
          execConfig={execConfig}
        />
      </Box>
      {modelStatus === ModelStatus.Pending && <PredictionListItems />}
      <ImportTensorflowClassificationModelDialog
        onClose={handleCloseImportClassifierDialog}
        open={ImportClassifierDialogOpen}
      />
      {selectedModel && (
        <SaveFittedModelDialog
          model={selectedModel}
          onClose={handleCloseSaveClassifierDialog}
          open={SaveClassifierDialogOpen}
        />
      )}
      <FitClassifierDialog
        openedDialog={fitClassifierDialogOpen}
        closeDialog={handleCloseFitClassifierDialog}
      />

      <EvaluateClassifierDialog
        openedDialog={evaluateClassifierDialogOpen}
        closeDialog={handleCloseEvaluateClassifierDialog}
      />
    </>
  );
};

const ModelSelection = ({
  selectedModel,
}: {
  selectedModel: SequentialClassifier | undefined;
}) => {
  const dispatch = useDispatch();
  const activeKindId = useSelector(selectActiveKindId);
  const selectedModelName = selectedModel?.name ?? "new";
  const handleModelChange = (event: SelectChangeEvent<unknown>) => {
    let value: string | number = event.target.value as string;

    if (value === "new") value = 0;

    dispatch(
      classifierSlice.actions.updateSelectedModelNameOrArch({
        kindId: activeKindId,
        modelName: value,
      }),
    );
  };
  const handleDisposeModel = () => {
    if (!selectedModel) return;
    classifierHandler.removeModel(selectedModel.name);
    dispatch(
      classifierSlice.actions.updateSelectedModelNameOrArch({
        kindId: activeKindId,
        modelName: 0,
      }),
    );
    dispatch(
      classifierSlice.actions.removeModelInfo({
        modelName: selectedModel.name,
      }),
    );
  };
  return (
    <Stack
      direction="row"
      width="100%"
      sx={(theme) => ({
        width: "100%",
        justifyContent: "space-between",
        py: 1.5,
        px: 0.5,
        borderTop: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <WithLabel
        label="Model:"
        labelProps={{
          variant: "body2",
          sx: {
            mr: "0.5rem",
            whiteSpace: "nowrap",
          },
        }}
        sx={{ maxWidth: "calc(100% - 23px)" }}
      >
        <StyledSelect
          value={selectedModelName}
          onChange={handleModelChange}
          fullWidth
          variant="standard"
          disabled={classifierHandler.getModelNames().length === 0}
        >
          <MenuItem
            dense
            value="new"
            sx={{
              borderRadius: 0,
              minHeight: "1rem",
            }}
          >
            New Model
          </MenuItem>
          {classifierHandler.getModelNames().map((modelName, idx) => (
            <MenuItem
              key={modelName + idx}
              dense
              value={modelName}
              sx={{
                borderRadius: 0,
                minHeight: "1rem",
              }}
            >
              {modelName}
            </MenuItem>
          ))}
        </StyledSelect>
      </WithLabel>
      <TooltipWithDisable title={"Delete the current model"} placement="bottom">
        <IconButton
          size="small"
          sx={{ pr: 0 }}
          onClick={handleDisposeModel}
          disabled={!selectedModel}
        >
          <DeleteIcon sx={{ fontSize: "1.15rem" }} />
        </IconButton>
      </TooltipWithDisable>
    </Stack>
  );
};
