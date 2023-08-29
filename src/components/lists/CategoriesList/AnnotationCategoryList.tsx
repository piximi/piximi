import React from "react";
import { Category, CategoryType } from "types";
//import { useCategoryHandlers } from "hooks";
import { CategoriesList } from "./CategoriesList";

type CategoriesListContextProps = {
  createdCategories: Array<Category>;
  categoryType: CategoryType;
  hasPredicted?: boolean;
};

export const AnnotationCategoryList = (props: CategoriesListContextProps) => {
  const { createdCategories: categories, categoryType, hasPredicted } = props;

  // const {
  //   categoryIsVisible,
  //   selectedCategory,
  //   unknownCategory,
  //   hasHidden,
  //   usedCategoryInfo,
  //   objectCountByCategory,
  //   handleSelectCategory,
  //   handleToggleCategoryVisibility,
  //   handleHideOtherCategories,
  //   handleShowAllCategories,
  //   dispatchDeleteObjectsOfCategory,
  //   dispatchDeleteCategories,
  //   dispatchUpsertCategory,
  // } = useCategoryHandlers(categoryType, categories);

  return (
    <CategoriesList
      createdCategories={categories}
      categoryType={categoryType}
      predicted={hasPredicted}
    />
  );
};
