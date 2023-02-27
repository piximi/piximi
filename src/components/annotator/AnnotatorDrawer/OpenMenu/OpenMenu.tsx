import React from "react";

import { Divider, Menu, MenuItem } from "@mui/material";

import { OpenImageMenuItem } from "./OpenImageMenuItem";
import { ImportAnnotationsFileMenuItem } from "./ImportAnnotationsFileMenuItem";
import { OpenExampleImageMenuItem } from "./OpenExampleImageMenuItem";
import { ProjectFileType } from "types/runtime";
import { useMenu } from "hooks";
// import { OpenProjectMenuItem } from "components/file-io/OpenProjectMenuItem";

type OpenMenuProps = {
  anchorEl: HTMLElement | null;
  onCloseMenu: () => void;
  open: boolean;
};

export const OpenMenu = ({ anchorEl, onCloseMenu, open }: OpenMenuProps) => {
  const {
    anchorEl: subMenuAnchorEl,
    onClose: onSubMenuClose,
    onOpen: onSubMenuOpen,
    open: subMenuOpen,
  } = useMenu();

  const onMenusClose = () => {
    onSubMenuClose();
    onCloseMenu();
  };

  return (
    <Menu open={open} anchorEl={anchorEl} onClose={onCloseMenu}>
      {/* TODO: currently dangerous to use fromAnnotator
                because of tensor reconciliation on discard changes */}
      {/* <OpenProjectMenuItem onMenuClose={onCloseMenu} fromAnnotator /> */}

      <MenuItem onClick={onSubMenuOpen}>Import annotations from</MenuItem>
      <Menu
        id="import-annotations-as-menu"
        anchorEl={subMenuAnchorEl}
        open={subMenuOpen}
        onClose={onSubMenuClose}
      >
        <ImportAnnotationsFileMenuItem
          onCloseMenu={onMenusClose}
          projectType={ProjectFileType.PIXIMI}
          key={ProjectFileType.PIXIMI}
        />

        <ImportAnnotationsFileMenuItem
          onCloseMenu={onMenusClose}
          projectType={ProjectFileType.COCO}
          key={ProjectFileType.COCO}
        />
      </Menu>

      <Divider />

      <OpenImageMenuItem onCloseMenu={onCloseMenu} />

      <OpenExampleImageMenuItem onCloseMenu={onCloseMenu} />
    </Menu>
  );
};
