import type { TooltipProps } from "@mui/material";
import { Tooltip } from "@mui/material";

export const TooltipWithDisable = (tooltipProps: TooltipProps) => {
  return (
    <Tooltip {...tooltipProps}>
      <span style={{ width: "max-content" }}>{tooltipProps.children}</span>
    </Tooltip>
  );
};
