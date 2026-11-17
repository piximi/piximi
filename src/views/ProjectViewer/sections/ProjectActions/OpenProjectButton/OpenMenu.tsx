import { Menu } from "@mui/material";

import { useCapability } from "core/backend";

import { OpenProjectMenuItem } from "./OpenProjectMenuItem";
import { OpenImageMenuItem } from "./OpenImageMenuItem";

import type React from "react";

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
  const projectIO = useCapability("project.io");
  const upload = useCapability("ingest.upload");
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
      {projectIO && <OpenProjectMenuItem onClose={onClose} />}

      {upload && <OpenImageMenuItem onCloseMenu={onClose} />}
      {/* TODO: Fix and implement Annotation Uploads*/}
    </Menu>
  );
};
