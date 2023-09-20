import React from "react";
import { useSelector } from "react-redux";

import { Divider, List } from "@mui/material";

import {
  ImageList,
  ClearAnnotationsGroup,
  AnnotationCategoryList,
} from "components/lists";
import { AppBarOffset, DividerHeader } from "components/styled-components";

import {
  ImportAnnotationListItem,
  ExportAnnotationsListItem,
} from "components/list-items";
import { ImageViewerAppBar } from "components/app-bars";

import {
  selectCreatedAnnotationCategories,
  selectSelectedImages,
} from "store/data";

import { CategoryType } from "types/Category";
import { BaseAppDrawer } from "../BaseAppDrawer";

export const ImageViewerDrawer = () => {
  const createdCategories = useSelector(selectCreatedAnnotationCategories);

  const annotatorImages = useSelector(selectSelectedImages);

  return (
    <BaseAppDrawer>
      <ImageViewerAppBar />

      <AppBarOffset />

      <Divider />

      <List dense>
        <ImportAnnotationListItem />
        <ExportAnnotationsListItem />
      </List>

      <DividerHeader textAlign="left" typographyVariant="body2" sx={{ my: 2 }}>
        Images
      </DividerHeader>

      <ImageList images={annotatorImages} />

      <DividerHeader textAlign="left" typographyVariant="body2" sx={{ my: 2 }}>
        Categories
      </DividerHeader>

      <AnnotationCategoryList
        createdCategories={createdCategories}
        categoryType={CategoryType.AnnotationCategory}
        hotkeysActive={true}
      />

      <Divider sx={{ mt: 1 }} />

      <ClearAnnotationsGroup />
    </BaseAppDrawer>
  );
};
