import React from "react";
import { useSelector } from "react-redux";

import {
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

import { ClassifierExecListItem } from "../ClassifierExecListItem";

import { CategoriesList } from "components/categories/CategoriesList";

import { classifierPredictedSelector } from "store/classifier";

import {
  createdCategoriesSelector,
  unknownCategorySelector,
} from "store/project";

import { Category, CategoryType } from "types";

import { APPLICATION_COLORS } from "colorPalette";

export const ClassifierList = () => {
  const categories = useSelector(createdCategoriesSelector);
  const unknownCategory = useSelector(unknownCategorySelector);

  const [collapsed, setCollapsed] = React.useState(true);
  const predicted = useSelector(classifierPredictedSelector);

  const onCollapseClick = () => {
    setCollapsed(!collapsed);
  };

  const onCategoryClickCallBack = (category: Category) => {};

  return (
    <List dense sx={{ bgcolor: APPLICATION_COLORS.classifierList }}>
      <ListItem button dense onClick={onCollapseClick}>
        <ListItemIcon>
          {collapsed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemIcon>

        <ListItemText primary="Classifier" />
      </ListItem>

      <Collapse in={collapsed} timeout="auto" unmountOnExit>
        <CategoriesList
          createdCategories={categories}
          unknownCategory={unknownCategory}
          predicted={predicted}
          categoryType={CategoryType.ClassifierCategory}
          onCategoryClickCallBack={onCategoryClickCallBack}
        />

        <Divider />

        <ClassifierExecListItem />
      </Collapse>
    </List>
  );
};
