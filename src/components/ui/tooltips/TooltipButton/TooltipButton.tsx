import React, { ReactNode } from "react";
import { Button, ButtonProps, IconButton, Tooltip } from "@mui/material";

type TooltipButtonProps = ButtonProps & {
  tooltipTitle: string | ReactNode;
  icon?: boolean;
};
export const TooltipButton = ({
  tooltipTitle,
  icon,
  ...props
}: TooltipButtonProps) => {
  return (
    <Tooltip
      // can't use "sx" prop directly to access tooltip
      // see: https://github.com/mui-org/material-ui/issues/28679
      slotProps={{
        tooltip: {
          sx: { backgroundColor: "#565656", fontSize: "0.85rem" },
        },
        arrow: { sx: { color: "#565656" } },
      }}
      title={tooltipTitle}
      disableInteractive
    >
      <span>{icon ? <IconButton {...props} /> : <Button {...props} />}</span>
    </Tooltip>
  );
};
