import React from "react";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import {
  KeyboardArrowRight as KeyboardArrowRightIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from "@mui/icons-material";

type CollapsibleListProps = {
  children: any;
  dense: boolean;
  primary: string;
  closed?: boolean;
  backgroundColor?: string;
  disablePadding?: boolean;
  paddingLeft?: boolean;
};

export const CollapsibleList = ({
  children,
  dense,
  closed,
  backgroundColor,
  primary,
  disablePadding,
  paddingLeft,
}: CollapsibleListProps) => {
  const [collapsed, setCollapsed] = React.useState(closed);

  const onClick = () => {
    setCollapsed(!collapsed);
  };

  return (
    <List
      sx={{ backgroundColor: backgroundColor ? backgroundColor : "" }}
      dense={dense}
    >
      <ListItem button onClick={onClick}>
        <ListItemIcon>
          {collapsed ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
        </ListItemIcon>

        <ListItemText primary={primary} />
      </ListItem>

      <Collapse
        in={collapsed}
        timeout="auto"
        unmountOnExit
        sx={{ paddingLeft: paddingLeft ? "2rem" : "auto" }}
      >
        <List
          component="div"
          dense={dense}
          disablePadding={disablePadding === false ? disablePadding : false}
        >
          {children}
        </List>
      </Collapse>
    </List>
  );
};
