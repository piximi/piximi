import { useMemo, useState } from "react";

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
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";
import { useParameterizedSelector } from "store/hooks";
import { selectActiveModel, selectModelInfo } from "store/classifier/selectors";

import { enumKeys } from "utils/objectUtils";
import { LossFunction, OptimizationAlgorithm } from "utils/dl/enums";

import { ModelSettingsTextField } from "../../../ModelSettingsTextField";

export const OptimizationSettings = () => {
  const dispatch = useDispatch();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const modelInfo = useParameterizedSelector(selectModelInfo, modelTarget);
  const model = useParameterizedSelector(selectActiveModel, modelTarget);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { trainable } = useClassifierStatus();
  const compileOptions = useMemo(() => {
    return modelInfo.optimizerSettings;
  }, [modelInfo]);

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
        kindId: modelTarget,
      }),
    );
  };
  const handleLossFunctionChange = (event: SelectChangeEvent<unknown>) => {
    const target = event.target as HTMLInputElement; //target.value is string
    const lossFunction = target.value as LossFunction;
    dispatch(
      classifierSlice.actions.updateModelOptimizerSettings({
        settings: { lossFunction },
        kindId: modelTarget,
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
        kindId: modelTarget,
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
              disabled={!!model}
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
              disabled={!!model}
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
              disabled={!!model || !trainable}
            />
          </WithLabel>
        </Stack>
      </Collapse>
    </Grid>
  );
};
