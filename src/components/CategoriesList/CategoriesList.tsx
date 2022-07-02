import { CollapsibleList } from "../CollapsibleList";
import React, { useEffect } from "react";
import { CategoryListItem } from "../CategoryListItem";
import { Category, CategoryType } from "types/Category";
import { CreateCategoryListItem } from "../CreateCategoryListItem";
import { PredictionVisibility } from "components/PredictionsVisibility/PredictionVisibility";

type CategoriesListProps = {
  categories: Array<Category>;
  categoryType: CategoryType;
  unknownCategory: Category;
  predicted: boolean;
};

export const CategoriesList = (props: CategoriesListProps) => {
  const { categories, categoryType, unknownCategory, predicted } = props;

  const [showPredictionVisibilityMenu, setShowPredictionVisibilityMenu] =
    React.useState<boolean>(true);

  useEffect(() => {
    setShowPredictionVisibilityMenu(predicted);
  }, [predicted]);

  return (
    <CollapsibleList primary="Categories">
      <CategoryListItem
        categoryType={categoryType}
        category={unknownCategory}
        key={unknownCategory.id}
        id={unknownCategory.id}
      />
      {categories.map((category: Category) => {
        return (
          <CategoryListItem
            categoryType={categoryType}
            category={category}
            key={category.id}
            id={category.id}
          />
        );
      })}
      {showPredictionVisibilityMenu && <PredictionVisibility />}

      <CreateCategoryListItem categoryType={categoryType} />
    </CollapsibleList>
  );
};
