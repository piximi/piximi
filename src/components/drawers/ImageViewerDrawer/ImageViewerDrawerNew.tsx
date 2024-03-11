import React from "react";
import { useSelector } from "react-redux";

import { Divider, List } from "@mui/material";

import {
  ClearAnnotationsGroup,
  AnnotationCategoryList,
} from "components/lists";
import { AppBarOffset, DividerHeader } from "components/styled-components";

import {
  ImportAnnotationListItem,
  ExportAnnotationsListItem,
} from "components/list-items";
import { ImageViewerAppBarNew } from "components/app-bars";

import { selectCreatedAnnotationCategories } from "store/slices/data";

import { BaseAppDrawer } from "../BaseAppDrawer";
import { selectImageViewerImages } from "store/slices/imageViewer/reselectors";
import { ImageListNew } from "components/lists/ImageList";

export const ImageViewerDrawerNew = () => {
  const createdCategories = useSelector(selectCreatedAnnotationCategories);

  const imageViewerImages = useSelector(selectImageViewerImages);

  return (
    <BaseAppDrawer>
      <ImageViewerAppBarNew />

      <AppBarOffset />

      <Divider />

      <List dense>
        <ImportAnnotationListItem />
        <ExportAnnotationsListItem />
      </List>

      <DividerHeader textAlign="left" typographyVariant="body2" sx={{ my: 2 }}>
        Images
      </DividerHeader>

      <ImageListNew images={imageViewerImages} />

      <DividerHeader textAlign="left" typographyVariant="body2" sx={{ my: 2 }}>
        Categories
      </DividerHeader>

      <AnnotationCategoryList
        createdCategories={createdCategories}
        hotkeysActive={true}
        view="ImageViewer"
      />

      <Divider sx={{ mt: 1 }} />

      <ClearAnnotationsGroup />
    </BaseAppDrawer>
  );
};
