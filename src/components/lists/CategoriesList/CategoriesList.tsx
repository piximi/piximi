import React, { useEffect } from "react";

import { Checkbox, ListItemIcon, Tooltip } from "@mui/material";

import {
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";

import { useDialogHotkey, useCategoryHandlers } from "hooks";

import { CollapsibleList } from "components/lists";
import { DialogWithAction, UpsertCategoriesDialog } from "components/dialogs";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";

import {
  CategoryItem,
  CategoryPredictionListItem,
} from "components/list-items";
import { CategoryItemMenu } from "components/menus";

import { Category, CategoryType, HotkeyView } from "types";

type CategoriesListProps = {
  createdCategories: Array<Category>;
  categoryType: CategoryType;
  predicted?: boolean;
};

// TODO: Make background different color (or find another way to differentiate list from section)
export const CategoriesList = (props: CategoriesListProps) => {
  const { createdCategories: categories, categoryType, predicted } = props;
  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const {
    categoryIsVisible,
    selectedCategory,
    unknownCategory,
    hasHidden,
    usedCategoryInfo,
    objectCountByCategory,
    handleSelectCategory,
    handleToggleCategoryVisibility,
    handleHideOtherCategories,
    handleShowAllCategories,
    dispatchDeleteObjectsOfCategory,
    dispatchDeleteCategories,
    dispatchUpsertCategory,
  } = useCategoryHandlers(categoryType, categories);

  const {
    onClose: handleCloseCreateCategoryDialog,
    onOpen: handleOpenCreateCategoryDialog,
    open: isCreateCategoryDialogOpen,
  } = useDialogHotkey(HotkeyView.CreateCategoryDialog);

  const {
    onClose: handleCloseDeleteCategoryDialog,
    onOpen: handleOpenDeleteCategoryDialog,
    open: isDeleteCategoryDialogOpen,
  } = useDialogHotkey(HotkeyView.DeleteCategoryDialog);

  const onOpenCategoryMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    category: Category
  ) => {
    handleSelectCategory(category);
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };
  const handleHideOtherCategoriesAndClose = (category: Category) => {
    handleHideOtherCategories(category);
    onCloseCategoryMenu();
  };

  const handleToggleCategoryVisibilityAndClose = (category: Category) => {
    handleToggleCategoryVisibility(category);

    onCloseCategoryMenu();
  };
  const handleDeleteAllCategories = () => {
    dispatchDeleteCategories(categories);
  };

  useEffect(() => {
    objectCountByCategory(unknownCategory.id);
  }, [objectCountByCategory, unknownCategory]);

  return (
    <CollapsibleList
      dense
      primary="Categories"
      secondary={
        <Tooltip title={`${hasHidden ? "Show" : "Hide"} All`}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <Checkbox
              checked={!hasHidden}
              checkedIcon={<LabelIcon />}
              disableRipple
              icon={<LabelOutlinedIcon />}
              tabIndex={-1}
              sx={{ color: "inherit", "&.Mui-checked": { color: "inherit" } }}
              onChange={() => {
                if (!hasHidden) {
                  handleHideOtherCategories();
                } else {
                  handleShowAllCategories();
                }
              }}
            />
          </ListItemIcon>
        </Tooltip>
      }
    >
      {[unknownCategory, ...categories].map((category: Category) => {
        return (
          <CategoryItem
            category={category}
            id={category.id}
            key={category.id}
            selectedCategory={selectedCategory ?? unknownCategory}
            objectCount={objectCountByCategory(category.id)}
            categoryisVisible={categoryIsVisible(category.id)}
            handleToggleCategoryVisibility={handleToggleCategoryVisibility}
            handleSelectCategory={handleSelectCategory}
            handleOpenCategoryMenu={onOpenCategoryMenu}
          />
        );
      })}

      {
        predicted && <CategoryPredictionListItem /> //TODO - UI: Should dissapear or be disabled?
      }
      <CustomListItemButton
        primaryText="Create Category"
        onClick={handleOpenCreateCategoryDialog}
        icon={<AddIcon />}
      />

      {
        categories.length > 0 && (
          <CustomListItemButton
            primaryText="Delete All Categories"
            onClick={handleOpenDeleteCategoryDialog}
            icon={<DeleteIcon color="disabled" />}
          />
        ) //TODO - UI: Should dissapear or be disabled?
      }
      <CategoryItemMenu
        anchorElCategoryMenu={categoryMenuAnchorEl}
        category={selectedCategory ?? unknownCategory}
        categoryHidden={
          !categoryIsVisible(selectedCategory?.id ?? unknownCategory.id)
        }
        handleCloseCategoryMenu={onCloseCategoryMenu}
        usedCategoryInfo={usedCategoryInfo}
        dispatchDeleteObjectsOfCategory={dispatchDeleteObjectsOfCategory}
        handleHideCategory={handleToggleCategoryVisibilityAndClose}
        handleHideOtherCategories={handleHideOtherCategoriesAndClose}
        openCategoryMenu={Boolean(categoryMenuAnchorEl)}
        dispatchUpsertCategory={dispatchUpsertCategory}
        dispatchDeleteCategories={dispatchDeleteCategories}
      />
      <UpsertCategoriesDialog
        usedCategoryInfo={usedCategoryInfo}
        dispatchUpsertCategory={dispatchUpsertCategory}
        onClose={handleCloseCreateCategoryDialog}
        open={isCreateCategoryDialogOpen}
      />
      <DialogWithAction
        title="Delete All Categories"
        content={`Affected objects will NOT be deleted, and instead be labelled as "Unknown"`}
        handleConfirmCallback={handleDeleteAllCategories}
        onClose={handleCloseDeleteCategoryDialog}
        open={isDeleteCategoryDialogOpen}
      />
    </CollapsibleList>
  );
};
