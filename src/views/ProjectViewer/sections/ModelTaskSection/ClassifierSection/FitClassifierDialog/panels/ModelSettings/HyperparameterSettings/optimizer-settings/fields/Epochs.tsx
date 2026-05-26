import React, { useMemo } from "react";

import { Tooltip } from "@mui/material";

import { useNumberField } from "hooks";

import { WithLabel } from "components/inputs";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";

import { isFieldLocked, lockReason } from "../../settingsLock";
import { ModelSettingsTextField } from "../../../ModelSettingsTextField";

export const Epochs = () => {
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
    inputValue: numEpochs,
    inputString: numEpochsDisplay,
    resetInputValue: resetNumEpochs,
    setLastValidInput: setLastValidEpoch,
    handleOnChangeValidation: handleNumEpochsChange,
    error: numEpochsInputError,
  } = useNumberField(fitOptions.epochs);
  const dispatchNumEpochs = () => {
    if (numEpochsInputError.error) {
      resetNumEpochs();
      return;
    }
    if (numEpochs === fitOptions.epochs) return;
    setLastValidEpoch(numEpochs);
    handleUpdateOptimizerSettings({ epochs: numEpochs });
  };
  return (
    <Tooltip
      title={lockReason("epochs", isTraining)}
      disableHoverListener={
        !isFieldLocked("epochs", isTraining, modelIsTrained)
      }
    >
      <span>
        <WithLabel
          data-help={HelpItem.Epochs}
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
            disabled={isFieldLocked("epochs", isTraining, modelIsTrained)}
          />
        </WithLabel>
      </span>
    </Tooltip>
  );
};
