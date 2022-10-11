import React, { useEffect } from "react";

import { CategoryItem } from "../CategoryItem";
import { CreateCategoryItem } from "../CreateCategory";

import { PredictionVisibility } from "../PredictionsVisibility/";
import { DeleteAllCategoriesItem } from "../DeleteAllCategories";
import { ShowAllCategoriesListItem } from "../ShowAllCategoriesListItem";

import { CollapsibleList } from "components/common/CollapsibleList";

import { Category, CategoryType } from "types";

type CategoriesListProps = {
  createdCategories: Array<Category>;
  categoryType: CategoryType;
  unknownCategory: Category;
  predicted: boolean;
  onCategoryClickCallBack: (category: Category) => void;
};

export const CategoriesList = (props: CategoriesListProps) => {
  const {
    createdCategories: categories,
    categoryType,
    unknownCategory,
    predicted,
    onCategoryClickCallBack,
  } = props;

  const [showPredictionVisibilityMenu, setShowPredictionVisibilityMenu] =
    React.useState<boolean>(true);

  const [showDeleteAllCategoriesIcon, setShowDeleteAllCategoriesIcon] =
    React.useState<boolean>(true);

  useEffect(() => {
    setShowPredictionVisibilityMenu(predicted);
  }, [predicted]);

  useEffect(() => {
    setShowDeleteAllCategoriesIcon(categories.length > 0);
  }, [categories]);

  return (
    <CollapsibleList dense primary="Categories">
      <CategoryItem
        categoryType={categoryType}
        category={unknownCategory}
        key={unknownCategory.id}
        id={unknownCategory.id}
        onCategoryClickCallBack={onCategoryClickCallBack}
      />
      {categories.map((category: Category) => {
        return (
          <CategoryItem
            categoryType={categoryType}
            category={category}
            key={category.id}
            id={category.id}
            onCategoryClickCallBack={onCategoryClickCallBack}
          />
        );
      })}

      {showPredictionVisibilityMenu && <PredictionVisibility />}

      <CreateCategoryItem categoryType={categoryType} />

      {showDeleteAllCategoriesIcon && (
        <DeleteAllCategoriesItem categoryType={categoryType} />
      )}
      <ShowAllCategoriesListItem categoryType={categoryType} />
    </CollapsibleList>
  );
};
