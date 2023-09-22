import AssessmentIcon from "@mui/icons-material/Assessment";
import React from "react";
import { ModelStatus } from "types/ModelType";
import { ModelExecButton } from "../ModelExecButton";

type EvaluateModelButtonProps = {
  disabled: boolean;
  disabledText: string;
  onClick: () => void;
  modelStatus: ModelStatus;
};

export const EvaluateModelButton = ({
  disabled,
  disabledText,
  onClick: handleClick,
  modelStatus,
}: EvaluateModelButtonProps) => {
  return (
    <ModelExecButton
      onClick={handleClick}
      buttonLabel="Evaluate Model"
      icon={AssessmentIcon}
      disabled={disabled}
      loading={modelStatus === ModelStatus.Evaluating}
      helperText="...Predicting"
      disabledText={disabledText}
    />
  );
};
