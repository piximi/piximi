import React from "react";

import {
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
} from "@mui/material";

import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
} from "@mui/icons-material";

import { useDialog } from "hooks";

import { CreateCategoryDialog } from "components/CreateCategoryDialog";

type CollapsibleListProps = {
  children: any;
  primary: string;
};

export const CollapsibleCategoryList = ({
  children,
  primary,
}: CollapsibleListProps) => {
  const [collapsed, setCollapsed] = React.useState(true);

  const onClick = () => {
    setCollapsed(!collapsed);
  };

  const { onClose, onOpen, open } = useDialog();

  return (
    <List dense>
      <ListItem button dense onClick={onClick}>
        <ListItemIcon>
          {collapsed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemIcon>

        <ListItemText primary={primary} />

        <ListItemSecondaryAction>
          <Tooltip title="Create new category">
            <IconButton
              edge="end"
              onClick={onOpen}
              style={{ padding: "0px", margin: "0px" }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </ListItemSecondaryAction>
      </ListItem>

      <Collapse in={collapsed} timeout="auto" unmountOnExit>
        <List component="div" dense disablePadding>
          {children}
        </List>
      </Collapse>
      <CreateCategoryDialog onClose={onClose} open={open} />
    </List>
  );
};
