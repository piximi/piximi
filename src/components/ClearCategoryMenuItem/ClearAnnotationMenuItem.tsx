import React from "react";

import { MenuItem, Typography } from "@mui/material";

import { useDialog } from "hooks";

import { ClearAnnotationDialog } from "components/ClearAnnotationDialog";

import { Category } from "types";

type ClearAnnotationMenuItemProps = {
  category: Category;
  onCloseCategoryMenu: () => void;
};

export const ClearAnnotationMenuItem = ({
  category,
  onCloseCategoryMenu,
}: ClearAnnotationMenuItemProps) => {
  const {
    onClose: onCloseClearAnnotationDialog,
    onOpen: onOpenClearAnnotationDialog,
    open: openClearAnnotationDialog,
  } = useDialog();

  const onClose = () => {
    onCloseClearAnnotationDialog();
    onCloseCategoryMenu();
  };

  return (
    <>
      <MenuItem onClick={onOpenClearAnnotationDialog}>
        <Typography variant="inherit">Clear Annotations</Typography>
      </MenuItem>

      <ClearAnnotationDialog
        category={category}
        onClose={onClose}
        open={openClearAnnotationDialog}
      />
    </>
  );
};
