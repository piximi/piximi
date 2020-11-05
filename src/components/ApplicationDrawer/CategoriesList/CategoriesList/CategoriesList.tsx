import { CollapsibleList } from "../../../CollapsibleList";
import React from "react";
import { useSelector } from "react-redux";
import { CategoryListItem } from "../CategoryListItem";
import { Category } from "../../../../types/Category";
import { createdCategoriesSelector } from "../../../../store/selectors";
import { UnknownCategoryListItem } from "../UnknownCategoryListItem";
import { CreateCategoryListItem } from "../CreateCategoryListItem";

export const CategoriesList = () => {
  const categories = useSelector(createdCategoriesSelector);

  return (
    <CollapsibleList primary="Categories">
      {categories.map((category: Category) => {
        return <CategoryListItem category={category} key={category.id} />;
      })}

      <UnknownCategoryListItem />

      <CreateCategoryListItem />
    </CollapsibleList>
  );
};
