import React from "react";

import { Divider, Menu } from "@mui/material";

import { OpenImageMenuItem } from "./OpenImageMenuItem";
import { OpenProjectFileMenuItem } from "./OpenProjectFileMenuItem";
import { OpenExampleImageMenuItem } from "./OpenExampleImageMenuItem";
import { ProjectFileType } from "types/runtime";
// import { OpenProjectMenuItem } from "components/file-io/OpenProjectMenuItem";

type OpenMenuProps = {
  anchorEl: HTMLElement | null;
  onCloseMenu: () => void;
  open: boolean;
};

export const OpenMenu = ({ anchorEl, onCloseMenu, open }: OpenMenuProps) => {
  return (
    <Menu open={open} anchorEl={anchorEl} onClose={onCloseMenu}>
      {/* TODO: currently dangerous to use fromAnnotator
                because of tensor reconciliation on discard changes */}
      {/* <OpenProjectMenuItem onMenuClose={onCloseMenu} fromAnnotator /> */}

      <OpenProjectFileMenuItem
        onCloseMenu={onCloseMenu}
        projectType={ProjectFileType.PIXIMI}
      />

      <OpenProjectFileMenuItem
        onCloseMenu={onCloseMenu}
        projectType={ProjectFileType.COCO}
      />

      <Divider />

      <OpenImageMenuItem onCloseMenu={onCloseMenu} />

      <OpenExampleImageMenuItem onCloseMenu={onCloseMenu} />
    </Menu>
  );
};
