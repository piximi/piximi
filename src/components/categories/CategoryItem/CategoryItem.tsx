import React from "react";

import {
  Checkbox,
  Chip,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";

import { Category } from "types";

import { APPLICATION_COLORS } from "utils/common/colorPalette";

type CategoryItemProps = {
  category: Category;
  id: string;
  categoryisVisible: boolean;
  selectedCategory: Category;
  handleToggleCategoryVisibility: (category: Category) => void;
  handleSelectCategory: (category: Category) => void;
  handleOpenCategoryMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    category: Category
  ) => void;
  objectCount: number;
};

export const CategoryItem = ({
  category,
  selectedCategory,
  id,
  categoryisVisible,
  handleToggleCategoryVisibility,
  handleSelectCategory,
  handleOpenCategoryMenu,
  objectCount,
}: CategoryItemProps) => {
  return (
    <ListItem
      secondaryAction={
        <IconButton
          edge="end"
          onClick={(event) => handleOpenCategoryMenu(event, category)}
        >
          <MoreHorizIcon />
        </IconButton>
      }
      disablePadding
    >
      <ListItemButton
        dense
        id={category.id}
        onClick={() => handleSelectCategory(category)}
        selected={category.id === selectedCategory.id}
        sx={{
          backgroundColor:
            category.id === selectedCategory.id
              ? APPLICATION_COLORS.highlightColor
              : "none",
        }}
      >
        <ListItemIcon>
          <Checkbox
            checked={categoryisVisible}
            checkedIcon={<LabelIcon />}
            disableRipple
            edge="start"
            sx={{
              color: category.color,
              "&.Mui-checked": { color: category.color },
            }}
            icon={<LabelOutlinedIcon />}
            tabIndex={-1}
            onChange={() => handleToggleCategoryVisibility(category)}
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
            height: "1.5em",
            minWidth: "2.5em",
            borderWidth: "2px",
            fontSize: "0.875rem",
            color: "white",
            backgroundColor: "inherit",
          }}
        />
      </ListItemButton>
    </ListItem>
  );
};
