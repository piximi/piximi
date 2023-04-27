import React from "react";
import { useSelector } from "react-redux";

import {
  Checkbox,
  Chip,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";
import {
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";

import { highlightedCategoriesSelector } from "store/project";
import { selectSelectedAnnotationCategory } from "store/data";

import { Category } from "types";

import { APPLICATION_COLORS } from "utils/common/colorPalette";

type CategoryItemProps = {
  category: Category;
  id: string;
  categoryisVisible: boolean;
  handleToggleCategory: (category: Category) => void;
  handleSelectCategory: (category: Category) => void;
  onOpenCategoryMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    category: Category
  ) => void;
  objectCount: number;
};

export const CategoryItem = ({
  category,
  id,
  categoryisVisible,
  handleToggleCategory,
  handleSelectCategory,
  onOpenCategoryMenu,
  objectCount,
}: CategoryItemProps) => {
  const highlightedCategory = useSelector(highlightedCategoriesSelector);
  const selectedCategory = useSelector(selectSelectedAnnotationCategory);

  const onCategoryClick = () => {
    handleSelectCategory(category);
  };

  return (
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
      <ListItemIcon>
        <Checkbox
          checked={categoryisVisible}
          checkedIcon={<LabelIcon style={{ color: category.color }} />}
          disableRipple
          edge="start"
          icon={<LabelOutlinedIcon style={{ color: category.color }} />}
          tabIndex={-1}
          onChange={() => handleToggleCategory(category)}
        />
      </ListItemIcon>

      <ListItemText
        id={id}
        primary={category.name}
        primaryTypographyProps={{ noWrap: true }}
      />

      <Chip
        label={objectCount}
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
        <IconButton
          edge="end"
          onClick={(event) => onOpenCategoryMenu(event, category)}
        >
          <MoreHorizIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};
