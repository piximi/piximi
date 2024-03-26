import React, { useState } from "react";

import { MenuItem, Typography } from "@mui/material";
import { KeyboardArrowRight as KeyboardArrowRightIcon } from "@mui/icons-material";

import { useMenu } from "hooks";

import { BaseMenu } from "../BaseMenu";
import { OpenProjectMenuNew } from "../OpenProjectMenu/OpenProjectMenuNew";
import { OpenImageMenuNew } from "../OpenImageMenu/OpenImageMenuNew";

type OpenMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
};

export const OpenMenuNew = ({ anchorEl, onClose, open }: OpenMenuProps) => {
  const [selectedMenu, setSelectedMenu] = useState<"project" | "image">();
  const {
    anchorEl: projectMenuAnchorEl,
    onClose: handleCloseProjectMenu,
    open: projectMenuOpen,
    onOpen: handleOpenProjectMenu,
  } = useMenu();

  const handleSelectProjectMenu = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setSelectedMenu("project");
    handleOpenProjectMenu(event);
  };
  const handleCloseAndDeselectProjectMenu = () => {
    setSelectedMenu(undefined);
    handleCloseProjectMenu();
    onClose();
  };
  const {
    anchorEl: imageMenuAnchorEl,
    onClose: handleCloseImageMenu,
    open: imageMenuOpen,
    onOpen: handleOpenImageMenu,
  } = useMenu();

  const handleSelectImageMenu = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setSelectedMenu("image");
    handleOpenImageMenu(event);
  };
  const handleCloseAndDeselectImageMenu = () => {
    setSelectedMenu(undefined);
    handleCloseImageMenu();
    onClose();
  };

  return (
    <BaseMenu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuItem
        onClick={handleSelectProjectMenu}
        sx={(theme) => ({
          display: "flex",
          justifyContent: "space-between",
          pr: theme.spacing(1),
        })}
        selected={selectedMenu === "project"}
      >
        <Typography variant="body2">Project</Typography>
        <KeyboardArrowRightIcon />
      </MenuItem>
      <MenuItem
        onClick={handleSelectImageMenu}
        sx={(theme) => ({
          display: "flex",
          justifyContent: "space-between",
          pr: theme.spacing(1),
        })}
        selected={selectedMenu === "image"}
      >
        <Typography variant="body2">Image</Typography>
        <KeyboardArrowRightIcon />
      </MenuItem>

      <OpenProjectMenuNew
        anchorEl={projectMenuAnchorEl}
        onClose={handleCloseAndDeselectProjectMenu}
        open={projectMenuOpen}
      />
      <OpenImageMenuNew
        anchorEl={imageMenuAnchorEl}
        onCloseMenu={handleCloseAndDeselectImageMenu}
        open={imageMenuOpen}
      />
    </BaseMenu>
  );
};
