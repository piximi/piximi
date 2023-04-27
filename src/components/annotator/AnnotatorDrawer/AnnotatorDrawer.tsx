import React from "react";
import { useSelector } from "react-redux";

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
  selectSelectedImages,
} from "store/data";

import { CategoryType } from "types/Category";

export const AnnotatorDrawer = () => {
  const createdCategories = useSelector(selectCreatedAnnotatorCategories);

  const annotatorImages = useSelector(selectSelectedImages);

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
        categoryType={CategoryType.AnnotationCategory}
      />

      <Divider />

      <ClearAnnotationsListItem />

      <Divider />

      <ApplicationOptionsList />
    </Drawer>
  );
};
