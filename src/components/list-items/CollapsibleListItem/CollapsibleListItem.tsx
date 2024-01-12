import React, { ReactNode, useMemo } from "react";
import {
  ListItemIcon,
  ListItemText,
  Collapse,
  ListItemButton,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const heights = {
  sm: "1.5rem",
  md: "3rem",
  lg: "4.5rem",
};

//TODO: generic way to indent items in list

type GenericCollapsibleListItemProps = {
  children?: any;
  primaryText: ReactNode;
  divider?: boolean;
  dense?: boolean;
  secondary?: JSX.Element;
  caretPosition?: "start" | "end";
  beginCollapsed?: boolean;
  disabled?: boolean;
  enforceHeight?: "sm" | "md" | "lg";
  indentSpacing?: number;
};

export const CollapsibleListItem = ({
  children,
  primaryText,
  divider,
  dense,
  secondary,
  caretPosition = "end",
  beginCollapsed = true,
  disabled,
  enforceHeight,
  indentSpacing = 4,
}: GenericCollapsibleListItemProps) => {
  const [collapsed, setCollapsed] = React.useState(beginCollapsed);

  const handleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const caret = useMemo(() => {
    return collapsed ? (
      <ChevronRightIcon fontSize={dense ? "small" : "medium"} />
    ) : (
      <ExpandMoreIcon fontSize={dense ? "small" : "medium"} />
    );
  }, [dense, collapsed]);

  const ListItemContents = () => {
    if (caretPosition === "start") {
      return (
        <>
          <ListItemIcon sx={{ minWidth: 0 }}>{caret}</ListItemIcon>

          <ListItemText primary={primaryText} sx={{ px: 0.5 }} />
          {secondary && secondary}
        </>
      );
    } else {
      return (
        <>
          {secondary && secondary}
          <ListItemText primary={primaryText} sx={{ px: 0.5 }} />
          <ListItemIcon sx={{ minWidth: 0 }}>{caret}</ListItemIcon>
        </>
      );
    }
  };

  return (
    <>
      <ListItemButton
        onClick={handleCollapse}
        disabled={disabled}
        sx={{
          height: enforceHeight ? heights[enforceHeight] : undefined,
          px: 0.5,
        }}
        dense={dense}
      >
        {ListItemContents()}
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
