import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Divider, Drawer, List } from "@mui/material";

import { ImageList } from "../ImageList";
import { OpenListItem } from "../OpenListItem";
import { SaveListItem } from "../SaveListItem";
import { ClearAnnotationsListItem } from "../ClearAnnotations";
import { AnnotatorAppBar } from "../../AnnotatorAppBar";

import { CategoriesList } from "components/categories/CategoriesList";
import { AppBarOffset } from "components/styled/AppBarOffset";
import { ApplicationOptionsList } from "components/common/ApplicationOptionsList";

import {
  createdAnnotatorCategoriesSelector,
  unknownAnnotationCategorySelector,
} from "store/selectors";

import { imageViewerSlice } from "store/slices";

import { Category, CategoryType } from "types/Category";

export const AnnotatorDrawer = () => {
  const createdCategories = useSelector(createdAnnotatorCategoriesSelector);
  const unknownAnnotationCategory = useSelector(
    unknownAnnotationCategorySelector
  );

  const dispatch = useDispatch();

  const onCategoryClickCallBack = (category: Category) => {
    dispatch(
      imageViewerSlice.actions.setSelectedCategoryId({
        selectedCategoryId: category.id,
      })
    );
  };

  return (
    <Drawer
      anchor="left"
      sx={{
        flexShrink: 0,
        width: (theme) => theme.spacing(32),
        "& > .MuiDrawer-paper": {
          width: (theme) => theme.spacing(32),
        },
      }}
      open
      variant="persistent"
    >
      <AnnotatorAppBar />

      <AppBarOffset />

      <Divider />

      <List dense>
        <OpenListItem />
        <SaveListItem />
      </List>

      <Divider />

      <ImageList />

      <Divider />

      <CategoriesList
        createdCategories={createdCategories}
        unknownCategory={unknownAnnotationCategory}
        predicted={false}
        categoryType={CategoryType.AnnotationCategory}
        onCategoryClickCallBack={onCategoryClickCallBack}
      />

      <Divider />

      <ClearAnnotationsListItem />

      <Divider />

      <ApplicationOptionsList />
    </Drawer>
  );
};
