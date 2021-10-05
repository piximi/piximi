import React from "react";
import { useDispatch } from "react-redux";
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
} from "@material-ui/core";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { useDialog } from "../../hooks";
import { OpenExampleProjectMenuItem } from "../OpenExampleProjectMenuItem";

type OpenMenuProps = {
  popupState: any;
};

export const OpenMenu = ({ popupState }: OpenMenuProps) => {
  return (
    <Menu {...bindMenu(popupState)}>
      <MenuList dense variant="menu">
        <OpenExampleProjectMenuItem popupState={popupState} />
      </MenuList>
    </Menu>
  );
};
