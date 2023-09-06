import React from "react";
import { ScatterPlot as ScatterPlotIcon } from "@mui/icons-material";
import { ModelExecButton } from "../ModelExecButton";

export const FitModelButton = ({
  onClick: handleClick,
}: {
  onClick: () => void;
}) => {
  return (
    <ModelExecButton
      onClick={handleClick}
      buttonLabel="Fit Model"
      icon={ScatterPlotIcon}
    />
  );
};
