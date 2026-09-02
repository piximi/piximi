import type { ReactElement, MouseEventHandler } from "react";
import { useRef, useState } from "react";

import type {
  ListItemButtonProps,
  TooltipProps,
  TypographyProps,
} from "@mui/material";
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
} from "@mui/material";

type TooltipType = Omit<TooltipProps, "children" | "title">;

type CustomListItemButtonProps = Pick<
  ListItemButtonProps,
  | "alignItems"
  | "disabled"
  | "divider"
  | "disableGutters"
  | "dense"
  | "selected"
  | "disableRipple"
  | "sx"
> & {
  primaryTypographyProps?: TypographyProps;
  primaryText: string | ReactElement;
  onClick: MouseEventHandler<HTMLDivElement> | undefined;
  icon?: ReactElement;
  secondaryIcon?: ReactElement;
  onSecondary?: MouseEventHandler<HTMLButtonElement> | undefined;
  additionalComponent?: ReactElement;
  tooltipText?: string;
  tooltipProps?: TooltipType;
};

export const CustomListItemButton = ({
  primaryText,
  onClick: handleClick,
  icon,
  secondaryIcon,
  onSecondary: handleSecondary,
  tooltipText,
  additionalComponent,
  primaryTypographyProps,
  tooltipProps,
  ...rest
}: CustomListItemButtonProps) => {
  const listItemRef = useRef<HTMLLIElement | null>(null);
  const [_tooltipProps] = useState<TooltipType>({
    placement: "bottom" as const,
    disableInteractive: true,
    enterDelay: 500,
    enterNextDelay: 500,
    arrow: true,
    componentsProps: {
      tooltip: {
        sx: {
          backgroundColor: "#565656",
          fontSize: "0.85rem",
          ...tooltipProps?.componentsProps?.tooltip?.sx,
        },
      },
      arrow: {
        sx: { color: "#565656", ...tooltipProps?.componentsProps?.arrow?.sx },
      },
    },
    ...tooltipProps,
  });

  return (
    <Tooltip title={tooltipText} {..._tooltipProps}>
      <span>
        <ListItem
          ref={listItemRef}
          secondaryAction={
            secondaryIcon ? (
              <IconButton
                edge="end"
                onClick={handleSecondary}
                size="small"
                sx={{
                  mr: "-15px",
                }}
              >
                {secondaryIcon}
              </IconButton>
            ) : undefined
          }
          disablePadding
          {...{ ...rest, "data-help": undefined }}
        >
          <ListItemButton onClick={handleClick} {...rest}>
            {icon && <ListItemIcon>{icon}</ListItemIcon>}

            <ListItemText
              primary={primaryText}
              slotProps={{ primary: primaryTypographyProps }}
            />
            {additionalComponent}
          </ListItemButton>
        </ListItem>
      </span>
    </Tooltip>
  );
};
