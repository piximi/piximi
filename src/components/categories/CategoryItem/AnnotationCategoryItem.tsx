import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import {
  Chip,
  IconButton,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import { highlightedCategoriesSelector } from "store/project";
import {
  selectAnnotationCountByCategory,
  selectSelectedAnnotationCategory,
} from "store/data";

import { Category } from "types";

import { APPLICATION_COLORS } from "utils/common/colorPalette";
import { AnnotationCategoryItemCheckbox } from "../CategoryItemCheckbox/AnnotationCategoryItemCheckbox";
import { AnnotationCategoryItemMenu } from "../CategoryItemMenu/AnnotationCategoryItemMenu";

type CategoryItemProps = {
  category: Category;
  id: string;
  onCategoryClickCallBack: (category: Category) => void;
};

export const AnnotationCategoryItem = ({
  category,
  id,
  onCategoryClickCallBack,
}: CategoryItemProps) => {
  const memoizedSelectAnnotationCountByCategory = useMemo(
    selectAnnotationCountByCategory,
    []
  );
  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const onOpenCategoryMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };

  const highlightedCategory = useSelector(highlightedCategoriesSelector);
  const selectedCategory = useSelector(selectSelectedAnnotationCategory);

  const annotationCount = useSelector((state) =>
    memoizedSelectAnnotationCountByCategory(state, category.id)
  );

  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    setCount(annotationCount);
  }, [annotationCount]);

  const onCategoryClick = () => {
    onCategoryClickCallBack(category);
  };

  return (
    <React.Fragment>
      <ListItem
        dense
        button
        id={category.id}
        onClick={onCategoryClick}
        selected={category.id === selectedCategory.id}
        sx={{
          backgroundColor:
            category.id === highlightedCategory
              ? APPLICATION_COLORS.highlightColor
              : "none",
        }}
      >
        <AnnotationCategoryItemCheckbox category={category} />

        <ListItemText
          id={id}
          primary={category.name}
          primaryTypographyProps={{ noWrap: true }}
        />

        <Chip
          label={count}
          size="small"
          sx={{
            height: "20px",
            borderWidth: "2px",
            fontSize: "0.875rem",
            color: "white",
            backgroundColor: category.color,
          }}
        />

        <ListItemSecondaryAction>
          <IconButton edge="end" onClick={onOpenCategoryMenu}>
            <MoreHorizIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>

      <AnnotationCategoryItemMenu
        anchorElCategoryMenu={categoryMenuAnchorEl}
        category={category}
        onCloseCategoryMenu={onCloseCategoryMenu}
        onOpenCategoryMenu={onOpenCategoryMenu}
        openCategoryMenu={Boolean(categoryMenuAnchorEl)}
      />
    </React.Fragment>
  );
};
