import type React from "react";

import { Menu } from "@mui/material";

import { OpenProjectMenuItem } from "./OpenProjectMenuItem";
import { OpenImageMenuItem } from "./OpenImageMenuItem";

type OpenMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
};

export const OpenMenu = ({ anchorEl, onClose, open }: OpenMenuProps) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
      slotProps={{
        list: {
          dense: true,
          sx: { py: 0, "& li": { px: 1, minHeight: 0, borderRadius: 0 } },
        },
      }}
    >
      <OpenProjectMenuItem onClose={onClose} />

      <OpenImageMenuItem onCloseMenu={onClose} />
      {/* TODO: Fix and implement Annotation Uploads*/}
    </Menu>
  );
};
