import React from "react";

import { LabelImportant as LabelImportantIcon } from "@mui/icons-material";

import { ModelStatus } from "types/ModelType";
import { ModelExecButton } from "../ModelExecButton";

type PredictModelButtonProps = {
  disabled: boolean;
  disabledText: string;
  onClick: () => void;
  modelStatus: ModelStatus;
};

export const PredictModelButton = ({
  disabled,
  disabledText,
  onClick: handleClick,
  modelStatus,
}: PredictModelButtonProps) => {
  return (
    <ModelExecButton
      onClick={handleClick}
      buttonLabel="Predict Model"
      icon={LabelImportantIcon}
      disabled={disabled}
      loading={modelStatus === ModelStatus.Predicting}
      helperText="...Predicting"
      disabledText={disabledText}
    />
  );
};
