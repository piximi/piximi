import React, { useMemo } from "react";

import type { SelectChangeEvent } from "@mui/material";
import { MenuItem, Tooltip } from "@mui/material";

import { StyledSelect, WithLabel } from "components/inputs";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";

import { enumKeys } from "utils/objectUtils";
import { OptimizationAlgorithm as OptimizationAlgorithmEnum } from "utils/dl/enums";

import { isFieldLocked, lockReason } from "../../settingsLock";

export const OptimizationAlgorithm = () => {
  const {
    handleUpdateOptimizerSettings,
    modelParams,
    modelIsTrained,
    classifierStatus,
  } = useClassifierStatus();
  const compileOptions = useMemo(() => {
    return modelParams.optimizerSettings;
  }, [modelParams]);
  const isTraining = classifierStatus === "training";
  const handleOptimizationAlgorithmChange = (
    event: SelectChangeEvent<unknown>,
  ) => {
    const target = event.target as HTMLInputElement; //target.value is string
    const optimizationAlgorithm = target.value as OptimizationAlgorithmEnum;
    handleUpdateOptimizerSettings({ optimizationAlgorithm });
  };
  return (
    <Tooltip
      title={lockReason("optimizationAlgorithm", isTraining)}
      disableHoverListener={
        !isFieldLocked("optimizationAlgorithm", isTraining, modelIsTrained)
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
            {enumKeys(OptimizationAlgorithmEnum).map((k) => {
              return (
                <MenuItem key={k} value={OptimizationAlgorithmEnum[k]} dense>
                  {OptimizationAlgorithmEnum[k]}
                </MenuItem>
              );
            })}
          </StyledSelect>
        </WithLabel>
      </span>
    </Tooltip>
  );
};
