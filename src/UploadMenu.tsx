import React from "react";
import { Menu } from "@material-ui/core";
import MenuItem from "@material-ui/core/MenuItem";
import Fade from "@material-ui/core/Fade";

type UploadMenuProps = {
  anchorEl: HTMLElement;
  onClose: () => void;
};

export const UploadMenu = ({ anchorEl, onClose }: UploadMenuProps) => {
  return (
    <Menu
      TransitionComponent={Fade}
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: "center", horizontal: "left" }}
      getContentAnchorEl={null}
      onClose={onClose}
      open={Boolean(anchorEl)}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <MenuItem onClick={onClose}>Profile</MenuItem>
    </Menu>
  );
};
