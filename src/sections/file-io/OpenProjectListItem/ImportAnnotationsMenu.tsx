import React from "react";

import { Menu } from "@mui/material";

import { ImportAnnotationsFileMenuItem } from "./ImportAnnotationsFileMenuItem";
import { ProjectFileType } from "utils/file-io/runtimeTypes";

type ImportAnnotationsMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
};

export const ImportAnnotationsMenu = ({
  anchorEl,
  onClose,
  open,
}: ImportAnnotationsMenuProps) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
    >
      <ImportAnnotationsFileMenuItem
        onCloseMenu={onClose}
        projectType={ProjectFileType.PIXIMI}
      />
      <ImportAnnotationsFileMenuItem
        onCloseMenu={onClose}
        projectType={ProjectFileType.COCO}
      />
    </Menu>
  );
};
