import React from "react";
import { useSelector } from "react-redux";
import { Box, Menu, MenuItem, MenuList, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";

import { selectActiveKindId } from "store/project/selectors";

import { UNKNOWN_CATEGORY_NAME } from "store/data/constants";
import { HotkeyContext } from "utils/enums";

import { Category } from "store/data/types";
import { CategoryDialog } from "components/dialogs/CategoryDialog";

type CategoryItemMenuProps = {
  anchorElCategoryMenu: any;
  category: Category;
  handleCloseCategoryMenu: () => void;
  openCategoryMenu: boolean;
  kind?: string;
  editCategory: (kindOrId: string, name: string, color: string) => void;
  deleteCategory: (category: Category, kindId: string) => void;
  clearObjects: (category: Category) => void;
};

export const CategoryItemMenu = ({
  anchorElCategoryMenu,
  category,
  handleCloseCategoryMenu,
  openCategoryMenu,
  kind,
  editCategory,
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
                data-testid="delete-category-button"
              />

              <CategoryMenuItem
                onClick={handleOpenEditCategoryDialog}
                label="Edit"
                data-testid="edit-category-button"
              />
            </>
          )}
          <CategoryMenuItem
            onClick={handleOpenDeleteObjectsDialog}
            label="Clear Objects"
          />
        </Box>
      </MenuList>
      <CategoryDialog
        action="edit"
        onConfirm={editCategory}
        initColor={category.color}
        initName={category.name}
        id={category.id}
        onClose={() => handleMenuCloseWith(handleCloseEditCategoryDialog)}
        open={isEditCategoryDialogOpen}
      />
      <ConfirmationDialog
        title={`Delete "${category.name}" Category`}
        content={`Objects categorized as "${category.name}" will NOT be deleted, and instead will be labeled as
        "Unknown".`}
        onConfirm={() => deleteCategory(category, kind ?? activeKind)}
        onClose={() => handleMenuCloseWith(handleCloseDeleteCategoryDialog)}
        isOpen={isDeleteCategoryDialogOpen}
        data-testid="delete-category-confirm-dialog"
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
  ...props
}: {
  label: string;
  onClick: () => void;
  [key: string]: any;
}) => {
  return (
    <MenuItem onClick={handleClick} dense {...props}>
      <Typography variant="inherit">{label}</Typography>
    </MenuItem>
  );
};
