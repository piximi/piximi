import React from "react";
import Menu from "@material-ui/core/Menu";
import MenuList from "@material-ui/core/MenuList";
import Divider from "@material-ui/core/Divider";
import { OpenProjectMenuItem } from "../OpenProjectMenuItem";
import { OpenExampleProjectMenuItem } from "../OpenExampleProjectMenuItem";
import { OpenClassifierMenuItem } from "../OpenClassifierMenuItem";

type OpenMenuProps = {
  anchorEl: any;
  onClose: () => void;
  open: boolean;
};

export const OpenMenu = ({ anchorEl, onClose, open }: OpenMenuProps) => {
  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
      getContentAnchorEl={null}
      open={open}
      transformOrigin={{ horizontal: "center", vertical: "top" }}
    >
      <MenuList dense variant="menu">
        <OpenProjectMenuItem onClose={onClose} />

        <Divider />

        <OpenExampleProjectMenuItem onClose={onClose} />

        <OpenClassifierMenuItem onClose={onClose} />
      </MenuList>
    </Menu>
  );
};
