import React from "react";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";

import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

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
