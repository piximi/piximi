import React, { useEffect } from "react";
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
  selectCreatedAnnotatorCategories,
  selectImageViewerImages,
} from "store/data";

import { imageViewerSlice } from "store/imageViewer";

import {
  Category,
  CategoryType,
  UNKNOWN_ANNOTATION_CATEGORY,
} from "types/Category";

export const AnnotatorDrawer = () => {
  const createdCategories = useSelector(selectCreatedAnnotatorCategories);

  const dispatch = useDispatch();

  const onCategoryClickCallBack = (category: Category) => {
    dispatch(
      imageViewerSlice.actions.setSelectedCategoryId({
        selectedCategoryId: category.id,
        execSaga: true,
      })
    );
  };

  const annotatorImages = useSelector(selectImageViewerImages);

  useEffect(() => {
    //console.log(annotatorImages);
  });

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

      <ImageList images={annotatorImages} />

      <Divider />

      <CategoriesList
        createdCategories={createdCategories}
        unknownCategory={UNKNOWN_ANNOTATION_CATEGORY}
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
