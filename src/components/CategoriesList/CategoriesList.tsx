import { CollapsibleList } from "../CollapsibleList";
import React from "react";
import { useSelector } from "react-redux";
import { CategoryListItem } from "../CategoryListItem";
import { Category } from "../../types/Category";
import { CreateCategoryListItem } from "../CreateCategoryListItem";
import {
  createdCategoriesSelector,
  unknownCategorySelector,
} from "../../store/selectors";

export const CategoriesList = () => {
  const categories = useSelector(createdCategoriesSelector);
  const unknownCategory = useSelector(unknownCategorySelector);

  return (
    <CollapsibleList primary="Categories">
      {categories.map((category: Category) => {
        return <CategoryListItem category={category} key={category.id} />;
      })}
      <CategoryListItem category={unknownCategory} key={unknownCategory.id} />
      <CreateCategoryListItem />
    </CollapsibleList>
  );
};
