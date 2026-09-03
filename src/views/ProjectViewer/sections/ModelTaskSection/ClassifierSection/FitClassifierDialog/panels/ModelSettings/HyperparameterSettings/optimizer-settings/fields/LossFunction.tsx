import { useMemo } from "react";

import type { SelectChangeEvent } from "@mui/material";
import { MenuItem, Tooltip } from "@mui/material";

import { StyledSelect, WithLabel } from "components/inputs";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";
import { LossFunction as LossFunctionEnum } from "core/dl/enums";

import { enumKeys } from "utils/objectUtils";

import { isFieldLocked, lockReason } from "../../settingsLock";

export const LossFunction = () => {
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
  const handleLossFunctionChange = (event: SelectChangeEvent<unknown>) => {
    const target = event.target as HTMLInputElement; //target.value is string
    const lossFunction = target.value as LossFunctionEnum;
    handleUpdateOptimizerSettings({ lossFunction });
  };
  return (
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
            disabled={isFieldLocked("lossFunction", isTraining, modelIsTrained)}
          >
            {enumKeys(LossFunctionEnum).map((k) => {
              return (
                <MenuItem key={k} value={LossFunctionEnum[k]} dense>
                  {LossFunctionEnum[k]}
                </MenuItem>
              );
            })}
          </StyledSelect>
        </WithLabel>
      </span>
    </Tooltip>
  );
};
