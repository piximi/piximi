import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Collapse, Grid2 as Grid, IconButton, Stack } from "@mui/material";
import { FunctionalDivider } from "components/ui";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "store/classifier";
import { selectClassifierFitOptions } from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";
import { TextFieldWithBlur } from "views/ProjectViewer/components/TextFieldWithBlur";
import { WithLabel } from "views/ProjectViewer/components/WithLabel";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";
import { useNumberField } from "views/ProjectViewer/hooks/useNumberField";

export const TrainingStrategySettings = () => {
  const dispatch = useDispatch();
  const activeKindId = useSelector(selectActiveKindId);
  const { trainable } = useClassifierStatus();
  const fitOptions = useSelector(selectClassifierFitOptions);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    inputValue: batchSize,
    resetInputValue: resetBatchSize,
    handleOnChangeValidation: handleBatchSizeChange,
    error: batchSizeInputError,
  } = useNumberField(fitOptions.batchSize);
  const {
    inputValue: numEpochs,
    resetInputValue: resetNumEpochs,
    handleOnChangeValidation: handleNumEpochsChange,
    error: numEpochsInputError,
  } = useNumberField(fitOptions.batchSize);
  const dispatchBatchSize = () => {
    if (batchSizeInputError.error) {
      resetBatchSize();
      return;
    }
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
            <TextFieldWithBlur
              id="epochs"
              size="small"
              onChange={handleNumEpochsChange}
              value={numEpochs}
              onBlur={dispatchNumEpochs}
              disabled={!trainable}
              slotProps={{
                inputLabel: { sx: { top: "-2px" } },
              }}
              sx={(theme) => ({
                width: "7ch",
                input: {
                  py: 0.5,
                  fontSize: theme.typography.body2.fontSize,
                  minHeight: "1rem",
                },
              })}
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
              <TextFieldWithBlur
                id="batch-size"
                size="small"
                onChange={handleBatchSizeChange}
                value={batchSize}
                onBlur={dispatchBatchSize}
                disabled={!trainable}
                slotProps={{
                  inputLabel: { sx: { top: "-2px" } },
                }}
                sx={(theme) => ({
                  width: "7ch",
                  input: {
                    py: 0.5,
                    fontSize: theme.typography.body2.fontSize,
                    minHeight: "1rem",
                  },
                })}
              />
            </WithLabel>
          </Collapse>
        </Stack>
      </Stack>
    </Grid>
  );
};
