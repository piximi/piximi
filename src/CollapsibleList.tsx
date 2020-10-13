import React from "react";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ListItemText from "@material-ui/core/ListItemText";
import Collapse from "@material-ui/core/Collapse";

type CollapsibleListProps = {
  children: any;
  primary: string;
};

export const CollapsibleList = ({
  children,
  primary,
}: CollapsibleListProps) => {
  const [collapsed, setCollapsed] = React.useState(true);

  const onClick = () => {
    setCollapsed(!collapsed);
  };

  return (
    <List dense>
      <ListItem button dense onClick={onClick}>
        <ListItemIcon>
          {collapsed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemIcon>
        <ListItemText primary={primary} />
      </ListItem>
      <Collapse in={collapsed} timeout="auto" unmountOnExit>
        <List component="div" dense disablePadding>
          {children}
        </List>
      </Collapse>
    </List>
  );
};
