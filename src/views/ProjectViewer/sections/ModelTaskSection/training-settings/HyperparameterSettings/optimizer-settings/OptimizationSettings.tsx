import { ExpandLess, ExpandMore } from "@mui/icons-material";
import {
  Collapse,
  Grid2 as Grid,
  IconButton,
  MenuItem,
  SelectChangeEvent,
  Stack,
} from "@mui/material";
import { FunctionalDivider } from "components/ui";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "store/classifier";
import {
  selectClassifierModel,
  selectClassifierOptimizerSettings,
} from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";
import { enumKeys } from "utils/objectUtils";
import { LossFunction, OptimizationAlgorithm } from "utils/models/enums";
import { ModelSettingsTextField } from "views/ProjectViewer/components/ModelSettingsTextField";
import { StyledSelect } from "components/inputs";
import { WithLabel } from "components/inputs";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";
import { useNumberField } from "hooks";

export const OptimizationSettings = () => {
  const dispatch = useDispatch();
  const activeKindId = useSelector(selectActiveKindId);
  const compileOptions = useSelector(selectClassifierOptimizerSettings);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const selectedModel = useSelector(selectClassifierModel);
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
