import React from "react";

import { CategoryItem } from "../CategoryItem";
import { CreateCategoryItem } from "../CreateCategory";

import { PredictionVisibility } from "../PredictionsVisibility/";
import { DeleteAllCategoriesItem } from "../DeleteAllCategories";
import { Visibility as VisibilityIcon } from "@mui/icons-material";
import { CollapsibleList } from "components/common/CollapsibleList";

import { Category, CategoryType } from "types";

import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { useCategoryHandlers } from "hooks/useCategoryHandlers.ts/useCategoryHandlers";
import { CategoryItemMenu } from "../CategoryItemMenu";

type CategoriesListProps = {
  createdCategories: Array<Category>;
  categoryType: CategoryType;
  predicted?: boolean;
};

// TODO: Make background white
export const CategoriesList = (props: CategoriesListProps) => {
  const { createdCategories: categories, categoryType, predicted } = props;
  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const {
    categoryIsVisible,
    selectedCategory,
    unknownCategory,
    hasHidden,
    objectCountByCategory,
    handleSelectCategory,
    handleToggleCategory,
    handleHideOtherCategories,
    handleShowAllCategories,
  } = useCategoryHandlers(CategoryType.AnnotationCategory, categories);

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
  const handleHideOtherCategoriesAndClose = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    category: Category
  ) => {
    handleHideOtherCategories(event, category);
    onCloseCategoryMenu();
  };

  const handleToggleCategoryAndClose = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    category: Category
  ) => {
    handleToggleCategory(category);

    onCloseCategoryMenu();
  };

  return (
    <CollapsibleList dense primary="Categories">
      <CategoryItem
        category={unknownCategory}
        key={unknownCategory.id}
        id={unknownCategory.id}
        objectCount={objectCountByCategory(unknownCategory.id)}
        categoryisVisible={categoryIsVisible(unknownCategory.id)}
        handleToggleCategory={handleToggleCategory}
        handleSelectCategory={handleSelectCategory}
        onOpenCategoryMenu={onOpenCategoryMenu}
      />
      {categories.map((category: Category) => {
        return (
          <CategoryItem
            category={category}
            id={category.id}
            key={category.id}
            objectCount={objectCountByCategory(category.id)}
            categoryisVisible={categoryIsVisible(category.id)}
            handleToggleCategory={handleToggleCategory}
            handleSelectCategory={handleSelectCategory}
            onOpenCategoryMenu={onOpenCategoryMenu}
          />
        );
      })}
      <CategoryItemMenu
        anchorElCategoryMenu={categoryMenuAnchorEl}
        category={selectedCategory ?? unknownCategory}
        categoryHidden={
          !categoryIsVisible(selectedCategory?.id ?? unknownCategory.id)
        }
        onCloseCategoryMenu={onCloseCategoryMenu}
        handleHideCategory={handleToggleCategoryAndClose}
        handleHideOtherCategories={handleHideOtherCategoriesAndClose}
        openCategoryMenu={Boolean(categoryMenuAnchorEl)}
      />

      {predicted && <PredictionVisibility />}

      <CreateCategoryItem categoryType={categoryType} />

      {categories.length > 0 && (
        <DeleteAllCategoriesItem categoryType={categoryType} />
      )}
      <ShowAllCategoriesListItem
        disabled={!hasHidden()}
        handleShowAll={handleShowAllCategories}
      />
    </CollapsibleList>
  );
};

export const ShowAllCategoriesListItem = ({
  disabled,
  handleShowAll,
}: {
  disabled?: boolean;
  handleShowAll: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}) => {
  return (
    <ListItemButton disabled={disabled} onClick={handleShowAll}>
      <ListItemIcon>
        <VisibilityIcon color="disabled" />
      </ListItemIcon>
      <ListItemText primary="Show All Categories" />
    </ListItemButton>
  );
};
