import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Collapse, Grid2 as Grid, IconButton, Stack } from "@mui/material";
import { FunctionalDivider } from "components/ui";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "store/classifier";
import {
  selectClassifierFitOptions,
  selectClassifierModel,
} from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";
import { ModelSettingsTextField } from "views/ProjectViewer/components/ModelSettingsTextField";
import { WithLabel } from "views/ProjectViewer/components/WithLabel";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";
import { useNumberField } from "views/ProjectViewer/hooks/useNumberField";

export const TrainingStrategySettings = () => {
  const dispatch = useDispatch();
  const activeKindId = useSelector(selectActiveKindId);
  const { trainable } = useClassifierStatus();
  const fitOptions = useSelector(selectClassifierFitOptions);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const selectedModel = useSelector(selectClassifierModel);

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
        kindId: activeKindId,
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
        kindId: activeKindId,
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
        <Stack direction="row" gap={2}>
          <WithLabel
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
              disabled={!!selectedModel || !trainable}
            />
          </WithLabel>
          <Collapse in={showAdvanced}>
            <WithLabel
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
                disabled={!!selectedModel || !trainable}
              />
            </WithLabel>
          </Collapse>
        </Stack>
      </Stack>
    </Grid>
  );
};
