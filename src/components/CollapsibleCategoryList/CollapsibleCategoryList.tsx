import React from "react";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ListItemText from "@material-ui/core/ListItemText";
import Collapse from "@material-ui/core/Collapse";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import { useDialog } from "../../hooks";
import { CreateCategoryDialog } from "../CreateCategoryDialog";
import AddIcon from "@material-ui/icons/Add";

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
