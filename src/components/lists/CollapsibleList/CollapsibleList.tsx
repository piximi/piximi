import React, { ReactNode } from "react";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  SxProps,
  ListItemButton,
} from "@mui/material";
import {
  KeyboardArrowRight as KeyboardArrowRightIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from "@mui/icons-material";

type CollapsibleListProps = {
  children: any;
  dense: boolean;
  primary: ReactNode;
  closed?: boolean;
  backgroundColor?: string;
  disablePadding?: boolean;
  disableNestIndent?: boolean;
  sx?: SxProps;
  onScroll?: (evt: React.UIEvent<HTMLDivElement, UIEvent>) => void;
  secondary?: JSX.Element;
  disabled?: boolean;
};

export const CollapsibleList = ({
  children,
  dense,
  closed,
  backgroundColor,
  primary,
  disablePadding,
  disableNestIndent,
  sx,
  onScroll,
  secondary,
  disabled,
}: CollapsibleListProps) => {
  const [collapsed, setCollapsed] = React.useState(closed);

  const handleClick = () => {
    setCollapsed(!collapsed);
  };

  return (
    <List
      sx={{ backgroundColor: backgroundColor ? backgroundColor : "" }}
      dense={dense}
    >
      <ListItem secondaryAction={secondary} disablePadding>
        <ListItemButton
          role={undefined}
          onClick={handleClick}
          disableGutters
          disabled={disabled}
          sx={{ py: 0.5, px: 2 }}
        >
          <ListItemText primary={primary} />
          <ListItemIcon sx={{ minWidth: 0 }}>
            {!collapsed ? (
              <KeyboardArrowDownIcon />
            ) : (
              <KeyboardArrowRightIcon />
            )}
          </ListItemIcon>
        </ListItemButton>
      </ListItem>

      <Collapse
        in={!collapsed}
        timeout="auto"
        unmountOnExit
        sx={{ paddingLeft: disableNestIndent ? "auto" : "2rem" }}
      >
        {children}
      </Collapse>
    </List>
  );
};
