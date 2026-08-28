import { useMemo } from "react";

import { Tooltip } from "@mui/material";

import { useNumberField } from "hooks";

import { WithLabel } from "components/inputs";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";

import { ModelSettingsTextField } from "../../../ModelSettingsTextField";
import { lockReason, isFieldLocked } from "../../settingsLock";

export const BatchSize = () => {
  const {
    handleUpdateOptimizerSettings,
    modelParams,
    modelIsTrained,
    classifierStatus,
  } = useClassifierStatus();
  const fitOptions = useMemo(() => {
    return modelParams.optimizerSettings;
  }, [modelParams]);
  const isTraining = classifierStatus === "training";
  const {
    inputValue: batchSize,
    inputString: batchSizeDisplay,
    resetInputValue: resetBatchSize,
    setLastValidInput: setLastValidBatchSize,
    handleOnChangeValidation: handleBatchSizeChange,
    error: batchSizeInputError,
  } = useNumberField(fitOptions.batchSize);
  const dispatchBatchSize = () => {
    if (batchSizeInputError.error) {
      resetBatchSize();
      return;
    }
    if (batchSize === fitOptions.batchSize) return;
    setLastValidBatchSize(batchSize);
    handleUpdateOptimizerSettings({ batchSize });
  };
  return (
    <Tooltip
      title={lockReason("batchSize", isTraining)}
      disableHoverListener={
        !isFieldLocked("batchSize", isTraining, modelIsTrained)
      }
    >
      <span>
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
            disabled={isFieldLocked("batchSize", isTraining, modelIsTrained)}
          />
        </WithLabel>
      </span>
    </Tooltip>
  );
};
