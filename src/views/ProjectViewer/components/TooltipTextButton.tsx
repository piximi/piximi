import { type ReactElement, type MouseEventHandler, cloneElement } from "react";

import { Button, Tooltip } from "@mui/material";

import { useTranslation } from "hooks";

import type { ButtonProps } from "@mui/material";

import type { HelpItem } from "data/help/HelpContent";

type TooltipTextButtonProps = Omit<ButtonProps, "onClick"> & {
  icon?: ReactElement;
  label: string;
  tooltipText: string;
  dataHelp?: HelpItem;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

const ICON_SIZE = "1.15em";

export const TooltipTextButton = ({
  icon,
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
        >
          {icon &&
            cloneElement(icon, {
              size: ICON_SIZE,
              sx: { fontSize: ICON_SIZE, mr: 0.5 },
            })}
          {t(label)}
        </Button>
      </span>
    </Tooltip>
  );
};
