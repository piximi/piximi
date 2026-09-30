import { type ReactElement, type MouseEventHandler, cloneElement } from "react";

import { Button, Tooltip } from "@mui/material";

import { useTranslation } from "hooks";

import type { ButtonProps } from "@mui/material";

import type { HelpItem } from "help/HelpContent";

type TooltipTextButtonProps = Omit<
  ButtonProps,
  "onClick" | "startIcon" | "endIcon"
> & {
  startIcon?: ReactElement;
  endIcon?: ReactElement;
  label: string;
  tooltipText: string;
  dataHelp?: HelpItem;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

const ICON_SIZE = "1.15em";

export const TooltipTextButton = ({
  startIcon,
  endIcon,
  label,
  tooltipText,
  dataHelp,
  onClick,
  ...props
}: TooltipTextButtonProps) => {
  const t = useTranslation();
  return (
    <Tooltip title={tooltipText}>
      <span>
        <Button
          data-help={dataHelp}
          variant="text"
          color="inherit"
          size="small"
          onClick={onClick}
          {...props}
          sx={{ ...props.sx, px: 1, pr: endIcon ? 0.5 : 1 }}
        >
          {startIcon &&
            cloneElement(startIcon, {
              size: ICON_SIZE,
              sx: { fontSize: ICON_SIZE, mr: 0.5 },
            })}
          {t(label)}
          {endIcon &&
            cloneElement(endIcon, {
              size: ICON_SIZE,
              sx: { fontSize: ICON_SIZE, ml: 0.5 },
            })}
        </Button>
      </span>
    </Tooltip>
  );
};
