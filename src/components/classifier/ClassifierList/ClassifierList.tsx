import React from "react";
import { useSelector } from "react-redux";

import { Divider } from "@mui/material";

import { CollapsibleList } from "components/common/CollapsibleList";
import { ClassifierExecListItem } from "../ClassifierExecListItem";

import { CategoriesList } from "components/categories/CategoriesList";

import { classifierPredictedSelector } from "store/classifier";

import {
  createdCategoriesSelector,
  unknownCategorySelector,
} from "store/project";

import { Category, CategoryType } from "types";

import { APPLICATION_COLORS } from "utils/common/colorPalette";

export const ClassifierList = () => {
  const categories = useSelector(createdCategoriesSelector);
  const unknownCategory = useSelector(unknownCategorySelector);

  const predicted = useSelector(classifierPredictedSelector);

  const onCategoryClickCallBack = (category: Category) => {};

  return (
    <CollapsibleList
      dense
      backgroundColor={APPLICATION_COLORS.classifierList}
      primary="Classifier"
    >
      <>
        <CategoriesList
          createdCategories={categories}
          unknownCategory={unknownCategory}
          predicted={predicted}
          categoryType={CategoryType.ClassifierCategory}
          onCategoryClickCallBack={onCategoryClickCallBack}
        />

        <Divider />

        <ClassifierExecListItem />
      </>
    </CollapsibleList>
  );
};
