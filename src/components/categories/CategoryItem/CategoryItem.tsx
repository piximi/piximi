import React from "react";
import { useSelector } from "react-redux";

import {
  Chip,
  IconButton,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import { CategoryItemCheckbox } from "../CategoryItemCheckbox";
import { CategoryItemMenu } from "../CategoryItemMenu";

import { categoryCountsSelector } from "store/classifier";
import { selectedCategorySelector } from "store/common";

import { Category, CategoryType, ImageType, State } from "types";

type CategoryItemProps = {
  categoryType: CategoryType;
  category: Category;
  id: string;
  onCategoryClickCallBack: (category: Category) => void;
};

export const CategoryItem = ({
  categoryType,
  category,
  id,
  onCategoryClickCallBack,
}: CategoryItemProps) => {
  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const onOpenCategoryMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };

  const selectedCategory = useSelector(selectedCategorySelector);

  const imageCount = useSelector((state: State) => {
    return state.project.images.filter((image: ImageType) => {
      return image.categoryId === category.id;
    }).length;
  });

  const categoryCounts = useSelector(categoryCountsSelector);

  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    categoryType === CategoryType.ClassifierCategory
      ? setCount(imageCount)
      : setCount(categoryCounts[category.id]);
  }, [category.id, categoryCounts, categoryType, imageCount]);

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
      >
        <CategoryItemCheckbox category={category} categoryType={categoryType} />

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

      <CategoryItemMenu
        anchorElCategoryMenu={categoryMenuAnchorEl}
        category={category}
        categoryType={categoryType}
        onCloseCategoryMenu={onCloseCategoryMenu}
        onOpenCategoryMenu={onOpenCategoryMenu}
        openCategoryMenu={Boolean(categoryMenuAnchorEl)}
      />
    </React.Fragment>
  );
};
