import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import { CategoryListItem } from "components/CategoryListItem";
import { PredictionVisibility } from "components/PredictionsVisibility/PredictionVisibility";
import { CreateCategoryListItem } from "components/CreateCategoryListItem";

import { CollapsibleList } from "components/common/CollapsibleList";

import {
  createdCategoriesSelector,
  unknownCategorySelector,
} from "store/selectors";
import { predictedSelector } from "store/selectors/predictedSelector";

import { Category } from "types/Category";

export const CategoriesList = () => {
  const categories = useSelector(createdCategoriesSelector);
  const unknownCategory = useSelector(unknownCategorySelector);

  const predicted = useSelector(predictedSelector);
  const [showPredictionVisibilityMenu, setShowPredictionVisibilityMenu] =
    React.useState<boolean>(true);

  useEffect(() => {
    setShowPredictionVisibilityMenu(predicted);
  }, [predicted]);

  return (
    <CollapsibleList dense primary="Categories">
      <CategoryListItem
        category={unknownCategory}
        key={unknownCategory.id}
        id={unknownCategory.id}
      />
      {categories.map((category: Category) => {
        return (
          <CategoryListItem
            category={category}
            key={category.id}
            id={category.id}
          />
        );
      })}
      {showPredictionVisibilityMenu && <PredictionVisibility />}
      <CreateCategoryListItem />
    </CollapsibleList>
  );
};
