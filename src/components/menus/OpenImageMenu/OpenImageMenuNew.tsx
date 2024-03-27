import React from "react";

import { BaseMenu } from "../BaseMenu";
import { OpenImageMenuItem } from "./OpenImageMenuItem";
import { OpenExampleImageMenuItemNew } from "./OpenExampleImageMenuItemNew";

type OpenImageMenuProps = {
  anchorEl: HTMLElement | null;
  onCloseMenu: () => void;
  open: boolean;
};

export const OpenImageMenuNew = ({
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
        vertical: "top",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
    >
      <OpenImageMenuItem onCloseMenu={onCloseMenu} />

      <OpenExampleImageMenuItemNew onCloseMenu={onCloseMenu} />
    </BaseMenu>
  );
};
