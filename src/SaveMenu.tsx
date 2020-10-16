import React from "react";
import Menu from "@material-ui/core/Menu";
import { bindMenu, PopupState } from "material-ui-popup-state/hooks";
import MenuList from "@material-ui/core/MenuList";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";

type SaveMenuProps = {
  menu: PopupState;
};

export const SaveMenu = ({ menu }: SaveMenuProps) => {
  return (
    <Menu
      anchorOrigin={{
        horizontal: "center",
        vertical: "bottom",
      }}
      getContentAnchorEl={null}
      transformOrigin={{
        horizontal: "center",
        vertical: "top",
      }}
      {...bindMenu(menu)}
    >
      <MenuList dense variant="menu">
        <MenuItem onClick={menu.close}>Save classifier</MenuItem>

        <Divider />

        <MenuItem onClick={menu.close}>Open example classifier</MenuItem>

        <MenuItem onClick={menu.close}>Open weights</MenuItem>
      </MenuList>
    </Menu>
  );
};
