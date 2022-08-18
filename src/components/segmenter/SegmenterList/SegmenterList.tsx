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

import { CategoriesList } from "components/categories/CategoriesList";
import { SegmenterExecListItem } from "../SegmenterExecListItem";

import {
  createdAnnotatorCategoriesSelector,
  unknownAnnotationCategorySelector,
} from "store/project";

import { CategoryType } from "types";
import { APPLICATION_COLORS } from "colorPalette";

export const SegmenterList = () => {
  const categories = useSelector(createdAnnotatorCategoriesSelector);
  const unknownCategory = useSelector(unknownAnnotationCategorySelector);

  const [collapsed, setCollapsed] = React.useState(false);

  const onCollapseClick = () => {
    setCollapsed(!collapsed);
  };

  return (
    <List dense sx={{ bgcolor: APPLICATION_COLORS.segmenterList }}>
      <ListItem button dense onClick={onCollapseClick}>
        <ListItemIcon>
          {collapsed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemIcon>

        <ListItemText primary="Segmenter" />
      </ListItem>

      <Collapse in={collapsed} timeout="auto" unmountOnExit>
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
      </Collapse>
    </List>
  );
};
