import React, { useState } from "react";

import { MenuItem, Typography } from "@mui/material";
import { KeyboardArrowRight as KeyboardArrowRightIcon } from "@mui/icons-material";

import { useMenu } from "hooks";

import { BaseMenu } from "components/UI_/BaseMenu";
import { OpenProjectMenu } from "./OpenProjectMenu";
import { OpenImageMenu } from "./OpenImageMenu";
import { ImportAnnotationsMenu } from "./ImportAnnotationsMenu";

type OpenMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
};

export const OpenMenu = ({ anchorEl, onClose, open }: OpenMenuProps) => {
  const [selectedMenu, setSelectedMenu] = useState<
    "project" | "image" | "annotation"
  >();
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

  const {
    anchorEl: annotationsMenuAnchorEl,
    onClose: handleCloseAnnotationMenu,
    open: annotationMenuOpen,
    onOpen: handleOpenAnnotationMenu,
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
      <MenuItem
        onClick={handleOpenAnnotationMenu}
        sx={(theme) => ({
          display: "flex",
          justifyContent: "space-between",
          pr: theme.spacing(1),
        })}
        selected={selectedMenu === "annotation"}
      >
        <Typography variant="body2">Annotation</Typography>
        <KeyboardArrowRightIcon />
      </MenuItem>

      <OpenProjectMenu
        anchorEl={projectMenuAnchorEl}
        onClose={handleCloseAndDeselectProjectMenu}
        open={projectMenuOpen}
      />
      <OpenImageMenu
        anchorEl={imageMenuAnchorEl}
        onCloseMenu={handleCloseAndDeselectImageMenu}
        open={imageMenuOpen}
      />
      <ImportAnnotationsMenu
        anchorEl={annotationsMenuAnchorEl}
        onClose={handleCloseAnnotationMenu}
        open={annotationMenuOpen}
      />
    </BaseMenu>
  );
};
