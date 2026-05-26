import React, { useMemo } from "react";

import { Tooltip } from "@mui/material";

import { useNumberField } from "hooks";

import { WithLabel } from "components/inputs";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";

import { ModelSettingsTextField } from "../../../ModelSettingsTextField";
import { lockReason, isFieldLocked } from "../../settingsLock";

export const TrainingPercentage = () => {
  const {
    handleUpdatePreprocessSettings,
    modelIsTrained,
    modelParams,
    classifierStatus,
  } = useClassifierStatus();
  const isTraining = classifierStatus === "training";
  const trainingPercentage = useMemo(() => {
    return modelParams.preprocessSettings.trainingPercentage;
  }, [modelParams]);
  const trainingFieldValidationOptions = useMemo(
    () => ({ min: 0.1, max: 0.99, enableFloat: true }),
    [],
  );
  const {
    inputValue: trainPercent,
    inputString: trainPercentDisplay,
    setLastValidInput: setLastValidTrainPercent,
    resetInputValue: resetTrainPercent,
    handleOnChangeValidation: handleTrainPercentChange,
    error: trainPercentError,
  } = useNumberField(trainingPercentage, trainingFieldValidationOptions);
  const dispatchTrainingPercentage = () => {
    if (trainPercentError.error) {
      resetTrainPercent();
      return;
    }
    if (trainPercent === trainingPercentage) return;
    setLastValidTrainPercent(trainPercent);
    handleUpdatePreprocessSettings({ trainingPercentage: trainPercent });
  };

  return (
    <Tooltip
      title={lockReason("trainingPercentage", isTraining)}
      disableHoverListener={
        !isFieldLocked("trainingPercentage", isTraining, modelIsTrained)
      }
    >
      <span>
        <WithLabel
          data-help={HelpItem.TrainPercentage}
          label="Training Percentage:"
          labelProps={{
            variant: "body2",
            sx: { mr: "1rem", whiteSpace: "nowrap" },
          }}
        >
          <ModelSettingsTextField
            size="small"
            onChange={handleTrainPercentChange}
            value={trainPercentDisplay}
            fullWidth
            onBlur={dispatchTrainingPercentage}
            disabled={isFieldLocked(
              "trainingPercentage",
              isTraining,
              modelIsTrained,
            )}
          />
        </WithLabel>
      </span>
    </Tooltip>
  );
};
