import React from "react";

import {
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

type CollapsibleListProps = {
  children: any;
  dense: boolean;
  primary: string;
  closed?: boolean;
};

export const CollapsibleList = ({
  children,
  dense,
  closed,
  primary,
}: CollapsibleListProps) => {
  const [collapsed, setCollapsed] = React.useState(closed);

  const onClick = () => {
    setCollapsed(!collapsed);
  };

  return (
    <List dense={dense}>
      <ListItem button onClick={onClick}>
        <ListItemIcon>
          {collapsed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemIcon>

        <ListItemText primary={primary} />
      </ListItem>

      <Collapse in={collapsed} timeout="auto" unmountOnExit>
        <List component="div" dense={dense} disablePadding>
          {children}
        </List>
      </Collapse>
    </List>
  );
};
