import { useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Collapse, Grid2 as Grid, IconButton, Stack } from "@mui/material";

import { useNumberField } from "hooks";

import { FunctionalDivider } from "components/ui";
import { WithLabel } from "components/inputs";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { classifierSlice } from "store/classifier";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";
import { useParameterizedSelector } from "store/hooks";
import { selectKindClassifier } from "store/classifier/selectors";
import { BASE_MODEL_NAME } from "store/classifier/constants";

import classifierHandler from "utils/dl/classification/classifierHandler";

import { ModelSettingsTextField } from "../../../ModelSettingsTextField";

export const TrainingStrategySettings = () => {
  const dispatch = useDispatch();
  const { trainable } = useClassifierStatus();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const kindClassifier = useParameterizedSelector(
    selectKindClassifier,
    modelTarget.id,
  );

  const model = useMemo(() => {
    if (!kindClassifier || !kindClassifier.activeModel) return;
    return classifierHandler.getModel(kindClassifier.activeModel);
  }, [kindClassifier?.activeModel]);
  const fitOptions = useMemo(() => {
    const modelName = kindClassifier.activeModel;
    if (!modelName)
      return kindClassifier.modelInfoDict[BASE_MODEL_NAME].optimizerSettings;
    return kindClassifier.modelInfoDict[modelName].optimizerSettings;
  }, [kindClassifier]);

  const {
    inputValue: batchSize,
    inputString: batchSizeDisplay,
    resetInputValue: resetBatchSize,
    setLastValidInput: setLastValidBatchSize,
    handleOnChangeValidation: handleBatchSizeChange,
    error: batchSizeInputError,
  } = useNumberField(fitOptions.batchSize);
  const {
    inputValue: numEpochs,
    inputString: numEpochsDisplay,
    resetInputValue: resetNumEpochs,
    setLastValidInput: setLastValidEpoch,
    handleOnChangeValidation: handleNumEpochsChange,
    error: numEpochsInputError,
  } = useNumberField(fitOptions.epochs);

  const dispatchBatchSize = () => {
    if (batchSizeInputError.error) {
      resetBatchSize();
      return;
    }
    if (batchSize === fitOptions.batchSize) return;
    setLastValidBatchSize(batchSize);
    dispatch(
      classifierSlice.actions.updateModelOptimizerSettings({
        settings: { batchSize },
        kindId: modelTarget.id,
      }),
    );
  };
  const dispatchNumEpochs = () => {
    if (numEpochsInputError.error) {
      resetNumEpochs();
      return;
    }
    if (numEpochs === fitOptions.epochs) return;
    setLastValidEpoch(numEpochs);
    dispatch(
      classifierSlice.actions.updateModelOptimizerSettings({
        settings: { epochs: numEpochs },
        kindId: modelTarget.id,
      }),
    );
  };
  return (
    <Grid size={12}>
      <FunctionalDivider
        headerText="Training Strategy"
        typographyVariant="body2"
        actions={
          <IconButton
            size="small"
            onClick={() => setShowAdvanced((showAdvanced) => !showAdvanced)}
          >
            {showAdvanced ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        }
      />

      <Stack sx={{ pl: 2 }}>
        <Stack direction="row" gap={2} sx={{ pt: 1 }}>
          <WithLabel
            data-help={HelpItem.Epochs}
            label="Epochs:"
            labelProps={{
              variant: "body2",
              sx: { mr: "1rem", whiteSpace: "nowrap" },
            }}
          >
            <ModelSettingsTextField
              id="epochs"
              size="small"
              onChange={handleNumEpochsChange}
              value={numEpochsDisplay}
              onBlur={dispatchNumEpochs}
              disabled={!!model || !trainable}
            />
          </WithLabel>
          <Collapse in={showAdvanced}>
            <WithLabel
              data-help={HelpItem.BatchSize}
              label="Batch Size:"
              labelProps={{
                variant: "body2",
                sx: { mr: "1rem", whiteSpace: "nowrap" },
              }}
            >
              <ModelSettingsTextField
                id="batch-size"
                size="small"
                onChange={handleBatchSizeChange}
                value={batchSizeDisplay}
                onBlur={dispatchBatchSize}
                disabled={!!model || !trainable}
              />
            </WithLabel>
          </Collapse>
        </Stack>
      </Stack>
    </Grid>
  );
};
