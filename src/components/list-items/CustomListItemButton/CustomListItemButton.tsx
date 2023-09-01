import React, { ReactElement, useRef } from "react";

import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  ListItemButtonProps,
  ListItemTextProps,
  IconButton,
} from "@mui/material";

type CustomLiteItemButtonProps = Pick<
  ListItemButtonProps,
  | "alignItems"
  | "disabled"
  | "divider"
  | "disableGutters"
  | "dense"
  | "selected"
  | "sx"
> &
  Pick<ListItemTextProps, "primaryTypographyProps"> & {
    primaryText: string | ReactElement;
    onClick: React.MouseEventHandler<HTMLDivElement> | undefined;
    icon?: ReactElement;
    secondaryIcon?: ReactElement;
    onSecondary?: React.MouseEventHandler<HTMLButtonElement> | undefined;
    additionalComponent?: ReactElement;
    tooltipText?: string;
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
  ...rest
}: CustomLiteItemButtonProps) => {
  const listItemRef = useRef<HTMLLIElement | null>(null);

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
      title={tooltipText}
      placement="bottom"
      disableInteractive
      enterDelay={500}
      enterNextDelay={500}
      arrow
    >
      <span>
        <ListItem
          ref={listItemRef}
          secondaryAction={
            secondaryIcon ? (
              <IconButton
                edge="end"
                onClick={handleSecondary}
                size={
                  listItemRef.current?.classList.contains("MuiListItem-dense")
                    ? "small"
                    : "medium"
                }
                sx={{
                  mr: listItemRef.current?.classList.contains(
                    "MuiListItem-dense"
                  )
                    ? "-15px"
                    : "",
                }}
              >
                {secondaryIcon}
              </IconButton>
            ) : undefined
          }
          disablePadding
        >
          <ListItemButton onClick={handleClick} {...rest}>
            {icon && <ListItemIcon>{icon}</ListItemIcon>}

            <ListItemText
              primary={primaryText}
              primaryTypographyProps={primaryTypographyProps}
            />
            {additionalComponent}
          </ListItemButton>
        </ListItem>
      </span>
    </Tooltip>
  );
};
