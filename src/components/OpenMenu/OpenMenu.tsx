import React from "react";
import { Menu, MenuList } from "@mui/material";
import { bindMenu } from "material-ui-popup-state";
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
