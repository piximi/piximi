import React from "react";
import { useSelector } from "react-redux";

import { Divider, Drawer, List } from "@mui/material";

import { CategoriesList } from "components/categories/CategoriesList";
import { AppBarOffset } from "components/common/styled-components";
import { ApplicationOptionsList } from "components/common/styled-components/ApplicationOptionsList";

import { ImageList } from "./ImageList";
import { OpenListItem } from "./OpenListItem";
import { SaveListItem } from "./SaveListItem";
import { ClearAnnotationsGroup } from "./ClearAnnotationsGroup";
import { AnnotatorAppBar } from "../AnnotatorAppBar";

import {
  selectCreatedAnnotationCategories,
  selectSelectedImages,
} from "store/data";

import { CategoryType } from "types/Category";

export const AnnotatorDrawer = () => {
  const createdCategories = useSelector(selectCreatedAnnotationCategories);

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

      <ClearAnnotationsGroup />

      <Divider />

      <ApplicationOptionsList />
    </Drawer>
  );
};
