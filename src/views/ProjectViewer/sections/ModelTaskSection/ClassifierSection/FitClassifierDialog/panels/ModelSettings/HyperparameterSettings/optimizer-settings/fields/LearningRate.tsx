import { useMemo } from "react";

import { Tooltip } from "@mui/material";

import { useNumberField } from "hooks";

import { WithLabel } from "components/inputs";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";

import { isFieldLocked, lockReason } from "../../settingsLock";
import { ModelSettingsTextField } from "../../../ModelSettingsTextField";

export const LearningRate = () => {
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

  const {
    inputValue: learningRate,
    inputString: learningRateDisplay,
    setLastValidInput: setLastValidLearningRate,
    resetInputValue: resetLearningRate,
    handleOnChangeValidation: handleLearningRateChange,
    error: learningRateInputError,
  } = useNumberField(compileOptions.learningRate, { enableFloat: true });
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
            disabled={isFieldLocked("learningRate", isTraining, modelIsTrained)}
          />
        </WithLabel>
      </span>
    </Tooltip>
  );
};
