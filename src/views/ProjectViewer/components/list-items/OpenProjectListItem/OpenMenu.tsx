import React, { useState } from "react";

import { MenuItem, Typography } from "@mui/material";
import { KeyboardArrowRight as KeyboardArrowRightIcon } from "@mui/icons-material";

import { useDialog, useMenu } from "hooks";

import { BaseMenu } from "components/ui/BaseMenu";
import { OpenProjectMenu } from "./OpenProjectMenu";
import { ImportAnnotationsMenu } from "./ImportAnnotationsMenu";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { OpenImageOptionsDialog } from "../../dialogs/OpenImageOptionsDialog";

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
    event: React.MouseEvent<HTMLElement, MouseEvent>,
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
    anchorEl: annotationsMenuAnchorEl,
    onClose: handleCloseAnnotationMenu,
    open: annotationMenuOpen,
    onOpen: handleOpenAnnotationMenu,
  } = useMenu();
  const {
    onClose: onCloseOpenImageDialog,
    onOpen: onOpenOpenImageDialog,
    open: OpenImageDialogIsOpen,
  } = useDialog();

  const handleCloseAndDeselectImageMenu = (
    event?: object,
    reason?: "backdropClick" | "escapeKeyDown" | "completed",
  ) => {
    onCloseOpenImageDialog();
    if (reason === "completed") {
      setSelectedMenu(undefined);
      onClose();
    }
  };

  return (
    <BaseMenu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuItem
        data-help={HelpItem.OpenProject}
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
        data-help={HelpItem.OpenImage}
        onClick={onOpenOpenImageDialog}
        sx={(theme) => ({
          display: "flex",
          justifyContent: "space-between",
          pr: theme.spacing(1),
        })}
        selected={selectedMenu === "image"}
      >
        <Typography variant="body2">Image</Typography>
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
      <OpenImageOptionsDialog
        open={OpenImageDialogIsOpen}
        onClose={handleCloseAndDeselectImageMenu}
      />
      <ImportAnnotationsMenu
        anchorEl={annotationsMenuAnchorEl}
        onClose={handleCloseAnnotationMenu}
        open={annotationMenuOpen}
      />
    </BaseMenu>
  );
};
