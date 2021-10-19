import React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import { useDialog } from "../../hooks";
import { CreateCategoryDialog } from "../CreateCategoryDialog";
import AddIcon from "@mui/icons-material/Add";

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
