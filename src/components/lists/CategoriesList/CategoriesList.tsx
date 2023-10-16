import React, { useEffect } from "react";

import { Checkbox, List } from "@mui/material";

import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
} from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { DialogWithAction, UpsertCategoriesDialog } from "components/dialogs";

import { Category, HotkeyView, PartialBy } from "types";
import { CategoryItem, ShowPredictionItems } from "components/list-items";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";
import { CategoryItemMenu } from "components/menus";

type CategoriesListProps = {
  createdCategories: Array<Category>;
  predicted?: boolean;
  selectedCategory?: Category;
  highlightedCategory?: string;
  dispatchDeleteCategories: (categories: Category | Category[]) => void;
  dispatchUpsertCategory: (
    category: PartialBy<Category, "id" | "visible">
  ) => void;
  handleSelectCategory: (category: Category) => void;
  handleToggleCategoryVisibility: (category: Category) => void;
  handleHideOtherCategories: (category?: Category | undefined) => void;
  handleShowAllCategories: () => void;
  categoryIsVisible: (categoryId: string) => boolean;
  hasHidden: boolean;
  objectCountByCategory: (categoryId: string) => number;
  dispatchDeleteObjectsOfCategory: (categoryId: string) => void;
  usedCategoryNames: string[];
  usedCategoryColors: string[];
  hotkeysActive?: boolean;
  unknownCategory: Category;
};

// TODO: Make background different color (or find another way to differentiate list from section)
export const CategoriesList = (props: CategoriesListProps) => {
  const {
    createdCategories: categories,
    predicted,
    selectedCategory,
    highlightedCategory,
    dispatchDeleteCategories,
    dispatchDeleteObjectsOfCategory,
    dispatchUpsertCategory,
    handleHideOtherCategories,
    handleSelectCategory,
    handleShowAllCategories,
    handleToggleCategoryVisibility,
    hasHidden,
    usedCategoryColors,
    usedCategoryNames,
    unknownCategory,
    categoryIsVisible,
    objectCountByCategory,
  } = props;

  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const {
    onClose: handleCloseCreateCategoryDialog,
    onOpen: handleOpenCreateCategoryDialog,
    open: isCreateCategoryDialogOpen,
  } = useDialogHotkey(HotkeyView.CreateCategoryDialog);

  const {
    onClose: handleCloseDeleteCategoryDialog,
    onOpen: handleOpenDeleteCategoryDialog,
    open: isDeleteCategoryDialogOpen,
  } = useDialogHotkey(HotkeyView.SimpleCancelConfirmDialog);

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

  const handleAllHidden = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (!hasHidden) {
      handleHideOtherCategories();
    } else {
      handleShowAllCategories();
    }
  };

  useEffect(() => {
    objectCountByCategory(unknownCategory.id);
  }, [objectCountByCategory, unknownCategory]);

  return (
    <>
      <List dense>
        <List dense sx={{ maxHeight: "20rem", overflowY: "scroll" }}>
          {[unknownCategory, ...categories].map((category: Category) => {
            return (
              <CategoryItem
                category={category}
                id={category.id}
                key={category.id}
                isSelected={
                  selectedCategory
                    ? selectedCategory.id === category.id
                    : unknownCategory.id === category.id
                }
                isHighlighted={highlightedCategory === category.id}
                objectCount={objectCountByCategory(category.id)}
                categoryisVisible={categoryIsVisible(category.id)}
                handleToggleCategoryVisibility={handleToggleCategoryVisibility}
                handleSelectCategory={handleSelectCategory}
                handleOpenCategoryMenu={onOpenCategoryMenu}
              />
            );
          })}
        </List>

        {
          predicted && <ShowPredictionItems /> //TODO - UI: Should dissapear or be disabled?
        }
        <CustomListItemButton
          primaryText={`${hasHidden ? "Show" : "Hide"} All`}
          icon={
            <Checkbox
              checked={!hasHidden}
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
          !categoryIsVisible(selectedCategory?.id ?? unknownCategory.id)
        }
        handleCloseCategoryMenu={onCloseCategoryMenu}
        usedCategoryColors={usedCategoryColors}
        usedCategoryNames={usedCategoryNames}
        dispatchDeleteObjectsOfCategory={dispatchDeleteObjectsOfCategory}
        handleHideCategory={handleToggleCategoryVisibilityAndClose}
        handleHideOtherCategories={handleHideOtherCategoriesAndClose}
        openCategoryMenu={Boolean(categoryMenuAnchorEl)}
        dispatchUpsertCategory={dispatchUpsertCategory}
        dispatchDeleteCategories={dispatchDeleteCategories}
      />
      <UpsertCategoriesDialog
        usedCategoryColors={usedCategoryColors}
        usedCategoryNames={usedCategoryNames}
        dispatchUpsertCategory={dispatchUpsertCategory}
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
