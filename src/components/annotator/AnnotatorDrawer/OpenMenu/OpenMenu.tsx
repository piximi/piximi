import React from "react";

import { Divider, Menu } from "@mui/material";

import { OpenImageMenuItem } from "./OpenImageMenuItem";
import { OpenProjectFileMenuItem } from "./OpenProjectFileMenuItem";
import { OpenExampleImageMenuItem } from "./OpenExampleImageMenuItem";
import { ProjectFileType } from "types/runtime";

type OpenMenuProps = {
  anchorEl: HTMLElement | null;
  onCloseMenu: () => void;
  open: boolean;
};

export const OpenMenu = ({ anchorEl, onCloseMenu, open }: OpenMenuProps) => {
  return (
    <Menu open={open} anchorEl={anchorEl} onClose={onCloseMenu}>
      <OpenImageMenuItem onCloseMenu={onCloseMenu} />

      <OpenProjectFileMenuItem
        onCloseMenu={onCloseMenu}
        projectType={ProjectFileType.PIXIMI}
      />

      <OpenProjectFileMenuItem
        onCloseMenu={onCloseMenu}
        projectType={ProjectFileType.COCO}
      />

      <Divider />

      <OpenExampleImageMenuItem onCloseMenu={onCloseMenu} />
    </Menu>
  );
};
