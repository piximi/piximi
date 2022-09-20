import React from "react";

import { Divider, Menu } from "@mui/material";

import { OpenImageMenuItem } from "./OpenImageMenuItem";
import { OpenProjectFileMenuItem } from "./OpenProjectFileMenuItem";
import { OpenExampleImageMenuItem } from "./OpenExampleImageMenuItem";

type OpenMenuProps = {
  anchorEl: HTMLElement | null;
  onCloseMenu: () => void;
  open: boolean;
};

export const OpenMenu = ({ anchorEl, onCloseMenu, open }: OpenMenuProps) => {
  return (
    <Menu open={open} anchorEl={anchorEl} onClose={onCloseMenu}>
      <OpenImageMenuItem onCloseMenu={onCloseMenu} />

      <OpenProjectFileMenuItem onCloseMenu={onCloseMenu} />

      <Divider />

      <OpenExampleImageMenuItem onCloseMenu={onCloseMenu} />
    </Menu>
  );
};
