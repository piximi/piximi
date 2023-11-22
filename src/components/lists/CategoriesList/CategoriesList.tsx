import React, { useContext, useEffect } from "react";

import { Checkbox, List } from "@mui/material";

import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
} from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { DialogWithAction, UpsertCategoriesDialog } from "components/dialogs";

import { Category, HotkeyView } from "types";
import { CategoryItem, ShowPredictionItems } from "components/list-items";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";
import { CategoryItemMenu } from "components/menus";
import { CategoryContext } from "contexts";

// TODO: Make background different color (or find another way to differentiate list from section)
export const CategoriesList = () => {
  const {
    createdCategories: categories,
    hasPredictions,
    isCategoryFiltered,
    selectCategory,
    highlightedCategory,
    unknownCategory,
    unavailableNames,
    availableColors,
    anyFiltered,
    getObjectCountPerCategory,
    selectedCategory,
    toggleCategoryFilter,
    filterOthers,
    unfilterCategories,
    deleteCategories,
    deleteObjectsOfCategory,
    upsertCategory,
  } = useContext(CategoryContext);

  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const {
    onClose: handleCloseCreateCategoryDialog,
    onOpen: handleOpenCreateCategoryDialog,
    open: isCreateCategoryDialogOpen,
  } = useDialogHotkey(HotkeyView.DialogWithAction);

  const {
    onClose: handleCloseDeleteCategoryDialog,
    onOpen: handleOpenDeleteCategoryDialog,
    open: isDeleteCategoryDialogOpen,
  } = useDialogHotkey(HotkeyView.DialogWithAction);

  const onOpenCategoryMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    category: Category
  ) => {
    selectCategory(category);
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };
  const handleHideOtherCategoriesAndClose = (category: Category) => {
    filterOthers(category);
    onCloseCategoryMenu();
  };

  const handleToggleCategoryVisibilityAndClose = (category: Category) => {
    toggleCategoryFilter(category);

    onCloseCategoryMenu();
  };
  const handleDeleteAllCategories = () => {
    deleteCategories(categories);
  };

  const handleAllHidden = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (!anyFiltered) {
      filterOthers();
    } else {
      unfilterCategories();
    }
  };

  useEffect(() => {
    getObjectCountPerCategory(unknownCategory.id);
  }, [getObjectCountPerCategory, unknownCategory]);

  return (
    <>
      <List dense>
        <List dense sx={{ maxHeight: "20rem", overflowY: "scroll" }}>
          {[unknownCategory, ...categories].map((category: Category) => {
            return (
              <CategoryItem
                category={category}
                key={category.id}
                isSelected={
                  selectedCategory
                    ? selectedCategory.id === category.id
                    : unknownCategory.id === category.id
                }
                isHighlighted={highlightedCategory === category.id}
                isFiltered={isCategoryFiltered(category.id)}
                handleOpenCategoryMenu={onOpenCategoryMenu}
              />
            );
          })}
        </List>

        {
          hasPredictions && <ShowPredictionItems /> //TODO - UI: Should dissapear or be disabled?
        }
        <CustomListItemButton
          primaryText={`${anyFiltered ? "Show" : "Hide"} All`}
          icon={
            <Checkbox
              checked={!anyFiltered}
              checkedIcon={<LabelIcon />}
              disableRipple
              icon={<LabelOutlinedIcon />}
              tabIndex={-1}
              size="small"
              sx={{
                color: "inherit",
                "&.Mui-checked": { color: "inherit" },
                pl: 0,
                py: 0,
              }}
            />
          }
          onClick={handleAllHidden}
          dense
        />
        <CustomListItemButton
          icon={<AddIcon />}
          primaryText="Create Category"
          onClick={handleOpenCreateCategoryDialog}
          dense
        />
        <CustomListItemButton
          icon={
            <DeleteIcon
              color={categories.length > 0 ? "inherit" : "disabled"}
            />
          }
          primaryText="Delete all categories"
          onClick={handleOpenDeleteCategoryDialog}
          dense
          disabled={categories.length === 0}
          tooltipText={
            categories.length === 0 ? "No user created categories" : undefined
          }
        />
      </List>

      <CategoryItemMenu
        anchorElCategoryMenu={categoryMenuAnchorEl}
        category={selectedCategory ?? unknownCategory}
        categoryHidden={
          !isCategoryFiltered(selectedCategory?.id ?? unknownCategory.id)
        }
        handleCloseCategoryMenu={onCloseCategoryMenu}
        usedCategoryColors={availableColors}
        usedCategoryNames={unavailableNames}
        dispatchDeleteObjectsOfCategory={deleteObjectsOfCategory}
        handleHideCategory={handleToggleCategoryVisibilityAndClose}
        handleHideOtherCategories={handleHideOtherCategoriesAndClose}
        openCategoryMenu={Boolean(categoryMenuAnchorEl)}
        dispatchUpsertCategory={upsertCategory}
        dispatchDeleteCategories={deleteCategories}
      />
      <UpsertCategoriesDialog
        usedCategoryColors={availableColors}
        usedCategoryNames={unavailableNames}
        dispatchUpsertCategory={upsertCategory}
        onClose={handleCloseCreateCategoryDialog}
        open={isCreateCategoryDialogOpen}
      />
      <DialogWithAction
        title="Delete All Categories"
        content={`Affected objects will NOT be deleted, and instead be labelled as "Unknown"`}
        onConfirm={handleDeleteAllCategories}
        onClose={handleCloseDeleteCategoryDialog}
        isOpen={isDeleteCategoryDialogOpen}
      />
    </>
  );
};
