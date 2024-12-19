import React from "react";
import { useSelector } from "react-redux";
import { Box, Menu, MenuItem, MenuList, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";
import { UpdateCategoryDialog } from "components/dialogs";

import { selectActiveKindId } from "store/project/selectors";

import { UNKNOWN_CATEGORY_NAME } from "store/data/constants";
import { HotkeyContext } from "utils/common/enums";

import { Category } from "store/data/types";

type CategoryItemMenuProps = {
  anchorElCategoryMenu: any;
  category: Category;
  handleCloseCategoryMenu: () => void;
  openCategoryMenu: boolean;
  kind?: string;
  deleteCategory: (category: Category, kindId: string) => void;
  clearObjects: (category: Category) => void;
};

export const CategoryItemMenu = ({
  anchorElCategoryMenu,
  category,
  handleCloseCategoryMenu,
  openCategoryMenu,
  kind,
  deleteCategory,
  clearObjects,
}: CategoryItemMenuProps) => {
  const activeKind = useSelector(selectActiveKindId);
  const {
    onClose: handleCloseEditCategoryDialog,
    onOpen: handleOpenEditCategoryDialog,
    open: isEditCategoryDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);
  const {
    onClose: handleCloseDeleteCategoryDialog,
    onOpen: handleOpenDeleteCategoryDialog,
    open: isDeleteCategoryDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const {
    onClose: handleCloseDeleteObjectsDialog,
    onOpen: handleOpenDeleteObjectsDialog,
    open: isDeleteObjectsDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleMenuCloseWith = (dialogClose: () => void) => {
    dialogClose();
    handleCloseCategoryMenu();
  };
  return (
    <Menu
      anchorEl={anchorElCategoryMenu}
      anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      onClose={handleCloseCategoryMenu}
      open={openCategoryMenu}
      transformOrigin={{ horizontal: "left", vertical: "top" }}
      MenuListProps={{ sx: { py: 0 } }}
    >
      <MenuList dense variant="menu" sx={{ py: 0 }}>
        <Box>
          {category.name !== UNKNOWN_CATEGORY_NAME && (
            <>
              <CategoryMenuItem
                onClick={handleOpenDeleteCategoryDialog}
                label="Delete"
              />

              <CategoryMenuItem
                onClick={handleOpenEditCategoryDialog}
                label="Edit"
              />
            </>
          )}
          <CategoryMenuItem
            onClick={handleOpenDeleteObjectsDialog}
            label="Clear Objects"
          />
        </Box>
      </MenuList>
      <UpdateCategoryDialog
        category={category}
        onClose={() => handleMenuCloseWith(handleCloseEditCategoryDialog)}
        open={isEditCategoryDialogOpen}
        kind={kind ?? activeKind}
      />
      <ConfirmationDialog
        title={`Delete "${category.name}" Category`}
        content={`Objects categorized as "${category.name}" will NOT be deleted, and instead will be labeled as
        "Unknown".`}
        onConfirm={() => deleteCategory(category, kind ?? activeKind)}
        onClose={() => handleMenuCloseWith(handleCloseDeleteCategoryDialog)}
        isOpen={isDeleteCategoryDialogOpen}
      />
      <ConfirmationDialog
        title={`Delete All "${category.name}" Objects`}
        content={`Objects categorized as "${category.name}" will be deleted. ${
          activeKind === "Image"
            ? "Associated annotations will also be removed."
            : ""
        } `}
        onConfirm={() => clearObjects(category)}
        onClose={() => handleMenuCloseWith(handleCloseDeleteObjectsDialog)}
        isOpen={isDeleteObjectsDialogOpen}
      />
    </Menu>
  );
};

const CategoryMenuItem = ({
  label,
  onClick: handleClick,
}: {
  label: string;
  onClick: () => void;
}) => {
  return (
    <MenuItem onClick={handleClick} dense>
      <Typography variant="inherit">{label}</Typography>
    </MenuItem>
  );
};
