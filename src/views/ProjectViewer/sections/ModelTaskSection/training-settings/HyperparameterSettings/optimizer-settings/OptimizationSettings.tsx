import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { ExpandLess, ExpandMore } from "@mui/icons-material";
import type { SelectChangeEvent } from "@mui/material";
import {
  Collapse,
  Grid2 as Grid,
  IconButton,
  MenuItem,
  Stack,
} from "@mui/material";

import { useNumberField } from "hooks";

import { FunctionalDivider } from "components/ui";
import { StyledSelect, WithLabel } from "components/inputs";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { classifierSlice } from "store/classifier";
import {
  selectActiveClassifierModel,
  selectClassifierOptimizerSettings,
} from "@ProjectViewer/state/reselectors";
import { selectActiveKindId } from "@ProjectViewer/state/selectors";
import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";

import { enumKeys } from "utils/objectUtils";
import { LossFunction, OptimizationAlgorithm } from "utils/modelsV2/enums";

import { ModelSettingsTextField } from "../../../ModelSettingsTextField";

export const OptimizationSettings = () => {
  const dispatch = useDispatch();
  const activeKindId = useSelector(selectActiveKindId);
  const compileOptions = useSelector(selectClassifierOptimizerSettings);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const selectedModel = useSelector(selectActiveClassifierModel);
  const { trainable } = useClassifierStatus();

  const {
    inputValue: learningRate,
    inputString: learningRateDisplay,
    setLastValidInput: setLastValidLearningRate,
    resetInputValue: resetLearningRate,
    handleOnChangeValidation: handleLearningRateChange,
    error: learningRateInputError,
  } = useNumberField(compileOptions.learningRate);

  const handleOptimizationAlgorithmChange = (
    event: SelectChangeEvent<unknown>,
  ) => {
    const target = event.target as HTMLInputElement; //target.value is string
    const optimizationAlgorithm = target.value as OptimizationAlgorithm;
    dispatch(
      classifierSlice.actions.updateModelOptimizerSettings({
        settings: { optimizationAlgorithm },
        kindId: activeKindId,
      }),
    );
  };
  const handleLossFunctionChange = (event: SelectChangeEvent<unknown>) => {
    const target = event.target as HTMLInputElement; //target.value is string
    const lossFunction = target.value as LossFunction;
    dispatch(
      classifierSlice.actions.updateModelOptimizerSettings({
        settings: { lossFunction },
        kindId: activeKindId,
      }),
    );
  };
  const dispatchLearningRate = () => {
    if (learningRateInputError.error) {
      resetLearningRate();
      return;
    }
    if (learningRate === compileOptions.learningRate) return;
    setLastValidLearningRate(learningRate);
    dispatch(
      classifierSlice.actions.updateModelOptimizerSettings({
        settings: { learningRate },
        kindId: activeKindId,
      }),
    );
  };
  return (
    <Grid size={12}>
      <FunctionalDivider
        headerText="Optimization"
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
      <Collapse in={showAdvanced}>
        <Stack sx={{ pl: 2 }} spacing={2}>
          <WithLabel
            data-help={HelpItem.OptimizationAlgorithm}
            label="Optimization Algorithm:"
            labelProps={{
              variant: "body2",
              sx: { mr: "1rem", whiteSpace: "nowrap" },
            }}
          >
            <StyledSelect
              value={compileOptions.optimizationAlgorithm}
              onChange={handleOptimizationAlgorithmChange}
              fullWidth
              disabled={!!selectedModel}
            >
              {enumKeys(OptimizationAlgorithm).map((k) => {
                return (
                  <MenuItem key={k} value={OptimizationAlgorithm[k]} dense>
                    {OptimizationAlgorithm[k]}
                  </MenuItem>
                );
              })}
            </StyledSelect>
          </WithLabel>
          <WithLabel
            data-help={HelpItem.LossFunction}
            label="Loss Function:"
            labelProps={{
              variant: "body2",
              sx: { mr: "1rem", whiteSpace: "nowrap" },
            }}
          >
            <StyledSelect
              value={compileOptions.lossFunction}
              onChange={handleLossFunctionChange}
              sx={{ maxWidth: "max-content" }}
              disabled={!!selectedModel}
            >
              {enumKeys(LossFunction).map((k) => {
                return (
                  <MenuItem key={k} value={LossFunction[k]} dense>
                    {LossFunction[k]}
                  </MenuItem>
                );
              })}
            </StyledSelect>
          </WithLabel>
          <WithLabel
            data-help={HelpItem.LearningRate}
            label="Learning Rate :"
            labelProps={{
              variant: "body2",
              sx: { mr: "1rem", whiteSpace: "nowrap" },
            }}
          >
            <ModelSettingsTextField
              id="learning-rate"
              size="small"
              onChange={handleLearningRateChange}
              value={learningRateDisplay}
              onBlur={dispatchLearningRate}
              disabled={!!selectedModel || !trainable}
            />
          </WithLabel>
        </Stack>
      </Collapse>
    </Grid>
  );
};
