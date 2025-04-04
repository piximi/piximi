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
import { selectClassifierOptimizerSettings } from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";
import { enumKeys } from "utils/common/helpers";
import { LossFunction, OptimizationAlgorithm } from "utils/models/enums";
import { StyledSelect } from "views/ProjectViewer/components/StyledSelect";
import { TextFieldWithBlur } from "views/ProjectViewer/components/TextFieldWithBlur";
import { WithLabel } from "views/ProjectViewer/components/WithLabel";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";
import { useNumberField } from "views/ProjectViewer/hooks/useNumberField";

export const OptimizationSettings = () => {
  const dispatch = useDispatch();
  const activeKindId = useSelector(selectActiveKindId);
  const compileOptions = useSelector(selectClassifierOptimizerSettings);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { trainable } = useClassifierStatus();

  const {
    inputValue: learningRate,
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
            <TextFieldWithBlur
              id="learning-rate"
              size="small"
              onChange={handleLearningRateChange}
              value={learningRate}
              onBlur={dispatchLearningRate}
              disabled={trainable}
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
        </Stack>
      </Collapse>
    </Grid>
  );
};
