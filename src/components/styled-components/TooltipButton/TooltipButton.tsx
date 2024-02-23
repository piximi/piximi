import { Button, ButtonProps, Tooltip } from "@mui/material";
import React, { ReactNode } from "react";

type TooltipButtonProps = ButtonProps & {
  tooltipTitle: string | ReactNode;
};
export const TooltipButton = ({
  tooltipTitle,
  ...props
}: TooltipButtonProps) => {
  return (
    <Tooltip
      // can't use "sx" prop directly to access tooltip
      // see: https://github.com/mui-org/material-ui/issues/28679
      componentsProps={{
        tooltip: {
          sx: { backgroundColor: "#565656", fontSize: "0.85rem" },
        },
        arrow: { sx: { color: "#565656" } },
      }}
      title={tooltipTitle}
      disableInteractive
    >
      {props.disabled ? (
        <span>
          <Button {...props} />
        </span>
      ) : (
        <Button {...props} />
      )}
    </Tooltip>
  );
};
