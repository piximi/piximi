import React from "react";
import { Tooltip, TooltipProps } from "@mui/material";

export const TooltipWithDisable = (tooltipProps: TooltipProps) => {
  return (
    <Tooltip {...tooltipProps}>
      <span style={{ width: "max-content" }}>{tooltipProps.children}</span>
    </Tooltip>
  );
};
