import React, { ReactNode } from "react";
import {
  ListItemIcon,
  ListItemText,
  Collapse,
  ListItemButton,
  Divider,
} from "@mui/material";
import {
  KeyboardArrowRight as KeyboardArrowRightIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from "@mui/icons-material";
import { HTMLDataAttributes } from "utils/types";

const heights = {
  sm: "1.5rem",
  md: "3rem",
  lg: "4.5rem",
};

//TODO: generic way to indent items in list

type GenericCollapsibleListItemProps = HTMLDataAttributes & {
  children?: any;
  primaryText: ReactNode;
  divider?: boolean;
  dense?: boolean;
  secondary?: JSX.Element;
  carotPosition?: "start" | "end";
  beginCollapsed?: boolean;
  disabled?: boolean;
  disabledCollapse?: boolean;
  enforceHeight?: "sm" | "md" | "lg";
  indentSpacing?: number;
};

export const CollapsibleListItem = ({
  children,
  primaryText,
  divider,
  dense,
  secondary,
  carotPosition = "end",
  beginCollapsed = true,
  disabled,
  disabledCollapse,
  enforceHeight,
  indentSpacing = 4,
  ...attrs
}: GenericCollapsibleListItemProps) => {
  const [collapsed, setCollapsed] = React.useState(beginCollapsed);

  const handleCollapse = () => {
    !disabledCollapse && setCollapsed(!collapsed);
  };

  return (
    <>
      <ListItemButton
        data-help={attrs["data-help"]}
        onClick={handleCollapse}
        disabled={disabled}
        sx={{
          height: enforceHeight ? heights[enforceHeight] : undefined,
          px: 1,
        }}
        dense={dense}
      >
        {carotPosition === "start" ? (
          <ListItemIcon sx={{ minWidth: 0 }}>
            {!collapsed ? (
              <KeyboardArrowDownIcon />
            ) : (
              <KeyboardArrowRightIcon />
            )}
          </ListItemIcon>
        ) : (
          secondary && secondary
        )}

        <ListItemText primary={primaryText} />
        {carotPosition === "end" ? (
          <ListItemIcon>
            {!collapsed ? (
              <KeyboardArrowDownIcon />
            ) : (
              <KeyboardArrowRightIcon />
            )}
          </ListItemIcon>
        ) : (
          secondary && secondary
        )}
      </ListItemButton>
      {divider && (
        <Divider
          variant="middle"
          sx={(theme) => ({
            borderColor: collapsed
              ? theme.palette.background.paper
              : theme.palette.text.primary,
            mb: collapsed ? 0 : 2,
            transition: "all 300ms cubic-bezier(0.4, 0, 0.2,1) 0ms ",
          })}
        />
      )}

      <Collapse in={!collapsed} timeout="auto" sx={{ pl: indentSpacing }}>
        {children}
      </Collapse>
    </>
  );
};
