import React from "react";

import { Menu, MenuItem } from "@mui/material";

import { useDialogHotkey, useMenu } from "hooks";

import { SaveAnnotationProjectDialog } from "./SaveAnnotationProjectDialog";
import { ExportAnnotationsAsLabeledInstancesMenuItem } from "./ExportAnnotationsAsLabeledInstancesMenuItem";
import { ExportAnnotationsAsMatrixMenuItem } from "./ExportAnnotationsAsMatrixMenuItem";
import { ExportAnnotationsAsLabeledSemanticMasksMenuItem } from "./ExportAnnotationsAsLabeledSemanticMasksMenuItem";
import { ExportAnnotationsAsBinarySemanticMasksMenuItem } from "./ExportAnnotationsAsBinarySemanticMasksMenuItem";
import { ExportAnnotationsAsBinaryInstancesMenuItem } from "./ExportAnnotationsAsBinaryInstancesMenuItem";
import { HotkeyView } from "types";

type SaveMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
};

export const SaveMenu = ({ anchorEl, onClose, open }: SaveMenuProps) => {
  const {
    onClose: onCloseSaveAnnotatorDialog,
    onOpen: onOpenSaveAnnotatorDialog,
    open: openSaveAnnotatorDialog,
  } = useDialogHotkey(HotkeyView.SaveAnnotationProjectDialog);

  const {
    anchorEl: subMenuAnchorEl,
    onClose: onSubMenuClose,
    onOpen: onSubMenuOpen,
    open: subMenuOpen,
  } = useMenu();

  const onMenusClose = () => {
    onSubMenuClose();
    onClose();
  };

  return (
    <div>
      <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
        <MenuItem onClick={onSubMenuOpen}>Export annotations as</MenuItem>
        <Menu
          id="save-annotations-as-menu"
          anchorEl={subMenuAnchorEl}
          keepMounted
          open={subMenuOpen}
          onClose={onSubMenuClose}
        >
          <ExportAnnotationsAsLabeledInstancesMenuItem
            handleMenuClose={onMenusClose}
          />
          <ExportAnnotationsAsBinaryInstancesMenuItem
            handleMenuClose={onMenusClose}
          />
          <ExportAnnotationsAsLabeledSemanticMasksMenuItem
            handleMenuClose={onMenusClose}
          />
          <ExportAnnotationsAsBinarySemanticMasksMenuItem
            handleMenuClose={onMenusClose}
          />
          <ExportAnnotationsAsMatrixMenuItem handleMenuClose={onMenusClose} />
          {/* <ExportAnnotationsAsJsonMenuItem handleMenuClose={onMenusClose} /> */}
        </Menu>
        <MenuItem onClick={onOpenSaveAnnotatorDialog}>
          Save Annotation Project
        </MenuItem>
      </Menu>

      <SaveAnnotationProjectDialog
        onClose={() => {
          onCloseSaveAnnotatorDialog();
          onMenusClose();
        }}
        open={openSaveAnnotatorDialog}
      />
    </div>
  );
};
