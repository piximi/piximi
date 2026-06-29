import type React from "react";

import { Menu } from "@mui/material";

import { OpenProjectMenuItem } from "./OpenProjectMenuItem";
import { OpenImageMenuItem } from "./OpenImageMenuItem";

type OpenMenuProps = {
  anchorEl: HTMLElement | null;
  anchorPosition: { top: number; left: number } | null;
  onClose: () => void;
  open: boolean;
};

export const OpenMenu = ({
  anchorEl,
  anchorPosition,
  onClose,
  open,
}: OpenMenuProps) => {
  return (
    <Menu
      anchorEl={anchorEl}
      anchorPosition={anchorPosition ?? undefined}
      anchorReference={anchorPosition ? "anchorPosition" : "anchorEl"}
      open={open}
      onClose={onClose}
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
