import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Divider, Drawer, List } from "@mui/material";

import { CategoriesList } from "components/categories/CategoriesList";
import { AppBarOffset } from "components/styled/AppBarOffset";
import { ApplicationOptionsList } from "components/common/ApplicationOptionsList";

import { ImageList } from "./ImageList";
import { OpenListItem } from "./OpenListItem";
import { SaveListItem } from "./SaveListItem";
import { ClearAnnotationsListItem } from "./ClearAnnotations";
import { AnnotatorAppBar } from "../AnnotatorAppBar";

import {
  createdAnnotatorCategoriesSelector,
  unknownAnnotationCategorySelector,
} from "store/project";
import {
  activeImageSelector,
  numStagedAnnotationsSelector,
  AnnotatorSlice,
  annotatorImagesSelector,
} from "store/annotator";

import { Category, CategoryType } from "types/Category";

export const AnnotatorDrawer = () => {
  const createdCategories = useSelector(createdAnnotatorCategoriesSelector);
  const unknownAnnotationCategory = useSelector(
    unknownAnnotationCategorySelector
  );

  const dispatch = useDispatch();

  const onCategoryClickCallBack = (category: Category) => {
    dispatch(
      AnnotatorSlice.actions.setSelectedCategoryId({
        selectedCategoryId: category.id,
        execSaga: true,
      })
    );
  };

  const annotatorImages = useSelector(annotatorImagesSelector);
  const activeImage = useSelector(activeImageSelector);
  const numStagedAnnotations = useSelector(numStagedAnnotationsSelector);

  return (
    <Drawer
      anchor="left"
      sx={{
        "flexShrink": 0,
        "width": (theme) => theme.spacing(32),
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

      {activeImage && (
        <ImageList
          activeImage={activeImage}
          images={annotatorImages}
          numStagedAnnotations={numStagedAnnotations}
        />
      )}

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
