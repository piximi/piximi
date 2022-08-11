import React from "react";

import {
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

import DescriptionIcon from "@mui/icons-material/Description";

type CollapsibleHelpContentProps = {
  children: any;
  dense: boolean;
  primary: string;
  closed?: boolean;
};

export const CollapsibleHelpContent = ({
  children,
  dense,
  closed,
  primary,
}: CollapsibleHelpContentProps) => {
  const [collapsed, setCollapsed] = React.useState(closed);

  const onClick = () => {
    setCollapsed(!collapsed);
  };

  return (
    <List dense={dense}>
      <ListItem button onClick={onClick}>
        <ListItemIcon>
          <DescriptionIcon />
        </ListItemIcon>
        <ListItemText primary={<Typography>{primary}</Typography>} />
      </ListItem>

      <Collapse in={collapsed} timeout="auto" unmountOnExit>
        <List component="div" dense={dense} disablePadding>
          {children}
        </List>
      </Collapse>
    </List>
  );
};
