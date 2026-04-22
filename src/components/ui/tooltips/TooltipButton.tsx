import React, { ReactNode } from "react";
import { Button, ButtonProps, IconButton, Tooltip } from "@mui/material";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

type TooltipButtonProps = ButtonProps & {
  tooltipTitle: string | ReactNode;
  icon?: boolean;
  dataHelp?: HelpItem;
};
export const TooltipButton = ({
  tooltipTitle,
  icon,
  dataHelp,
  ...props
}: TooltipButtonProps) => {
  return (
    <Tooltip
      data-help={dataHelp}
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
