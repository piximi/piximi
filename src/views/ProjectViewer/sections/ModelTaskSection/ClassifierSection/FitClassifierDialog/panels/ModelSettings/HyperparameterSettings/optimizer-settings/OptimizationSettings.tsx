import { useMemo, useState } from "react";

import { ExpandLess, ExpandMore } from "@mui/icons-material";
import type { SelectChangeEvent } from "@mui/material";
import {
  Collapse,
  Grid2 as Grid,
  IconButton,
  MenuItem,
  Stack,
  Tooltip,
} from "@mui/material";

import { useNumberField } from "hooks";

import { FunctionalDivider } from "components/ui";
import { StyledSelect, WithLabel } from "components/inputs";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";

import { enumKeys } from "utils/objectUtils";
import { LossFunction, OptimizationAlgorithm } from "utils/dl/enums";

import { ModelSettingsTextField } from "../../ModelSettingsTextField";
import { isFieldLocked, lockReason } from "../settingsLock";

import type { SettingsProps } from "../props";

export const OptimizationSettings = ({ isTraining }: SettingsProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { handleUpdateOptimizerSettings, modelParams, modelIsTrained } =
    useClassifierStatus();

  const compileOptions = useMemo(() => {
    return modelParams.optimizerSettings;
  }, [modelParams]);

  const {
    inputValue: learningRate,
    inputString: learningRateDisplay,
    setLastValidInput: setLastValidLearningRate,
    resetInputValue: resetLearningRate,
    handleOnChangeValidation: handleLearningRateChange,
    error: learningRateInputError,
  } = useNumberField(compileOptions.learningRate, { enableFloat: true });

  const handleOptimizationAlgorithmChange = (
    event: SelectChangeEvent<unknown>,
  ) => {
    const target = event.target as HTMLInputElement; //target.value is string
    const optimizationAlgorithm = target.value as OptimizationAlgorithm;
    handleUpdateOptimizerSettings({ optimizationAlgorithm });
  };
  const handleLossFunctionChange = (event: SelectChangeEvent<unknown>) => {
    const target = event.target as HTMLInputElement; //target.value is string
    const lossFunction = target.value as LossFunction;
    handleUpdateOptimizerSettings({ lossFunction });
  };
  const dispatchLearningRate = () => {
    if (learningRateInputError.error) {
      resetLearningRate();
      return;
    }
    if (learningRate === compileOptions.learningRate) return;

    setLastValidLearningRate(learningRate);
    handleUpdateOptimizerSettings({ learningRate });
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
          <Tooltip
            title={lockReason("optimizationAlgorithm", isTraining)}
            disableHoverListener={
              !isFieldLocked(
                "optimizationAlgorithm",
                isTraining,
                modelIsTrained,
              )
            }
          >
            <span>
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
                  disabled={isFieldLocked(
                    "optimizationAlgorithm",
                    isTraining,
                    modelIsTrained,
                  )}
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
            </span>
          </Tooltip>
          <Tooltip
            title={lockReason("lossFunction", isTraining)}
            disableHoverListener={
              !isFieldLocked("lossFunction", isTraining, modelIsTrained)
            }
          >
            <span>
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
                  disabled={isFieldLocked(
                    "lossFunction",
                    isTraining,
                    modelIsTrained,
                  )}
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
            </span>
          </Tooltip>
          <Tooltip
            title={lockReason("learningRate", isTraining)}
            disableHoverListener={
              !isFieldLocked("learningRate", isTraining, modelIsTrained)
            }
          >
            <span>
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
                  disabled={isFieldLocked(
                    "learningRate",
                    isTraining,
                    modelIsTrained,
                  )}
                />
              </WithLabel>
            </span>
          </Tooltip>
        </Stack>
      </Collapse>
    </Grid>
  );
};
