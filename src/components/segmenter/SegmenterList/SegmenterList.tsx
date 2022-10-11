import React from "react";
import { useSelector } from "react-redux";

import { Divider } from "@mui/material";

import { CategoriesList } from "components/categories/CategoriesList";
import { SegmenterExecListItem } from "../SegmenterExecListItem";

import {
  createdAnnotatorCategoriesSelector,
  unknownAnnotationCategorySelector,
} from "store/project";

import { CategoryType } from "types";
import { APPLICATION_COLORS } from "colorPalette";
import { CollapsibleList } from "components/common/CollapsibleList";

export const SegmenterList = () => {
  const categories = useSelector(createdAnnotatorCategoriesSelector);
  const unknownCategory = useSelector(unknownAnnotationCategorySelector);

  return (
    <CollapsibleList
      dense
      backgroundColor={APPLICATION_COLORS.segmenterList}
      primary="Segmenter"
    >
      <>
        <CategoriesList
          createdCategories={categories}
          unknownCategory={unknownCategory}
          predicted={false}
          categoryType={CategoryType.AnnotationCategory}
          onCategoryClickCallBack={() => {
            return;
          }}
        />

        <Divider />

        <SegmenterExecListItem />
      </>
    </CollapsibleList>
  );
};
