import React from "react";

import { BaseMenu } from "components/ui/BaseMenu";
import { OpenImageMenuItem } from "./OpenImageMenuItem";
import { OpenExampleImageMenuItem } from "./OpenExampleImageMenuItem";

type OpenImageMenuProps = {
  anchorEl: HTMLElement | null;
  onCloseMenu: () => void;
  open: boolean;
};

export const OpenImageMenu = ({
  anchorEl,
  onCloseMenu,
  open,
}: OpenImageMenuProps) => {
  return (
    <BaseMenu
      open={open}
      anchorEl={anchorEl}
      onClose={onCloseMenu}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
    >
      <OpenImageMenuItem onCloseMenu={onCloseMenu} />

      <OpenExampleImageMenuItem onCloseMenu={onCloseMenu} />
    </BaseMenu>
  );
};
