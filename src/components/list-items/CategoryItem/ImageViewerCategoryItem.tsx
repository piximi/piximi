import React from "react";

import { Checkbox, Chip } from "@mui/material";
import {
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";

import { APPLICATION_COLORS } from "utils/common/colorPalette";
import { CustomListItemButton } from "../CustomListItemButton";
import { NewCategory } from "types/Category";
import { useImageViewerCategoryItemState } from "./useImageViewerCategoryItemState";

type ImageViewerCategoryItemProps = {
  category: NewCategory;
  kind: string;
  handleOpenCategoryMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    category: NewCategory
  ) => void;
};

export const ImageViewerCategoryItem = ({
  category,
  kind,
  handleOpenCategoryMenu,
}: ImageViewerCategoryItemProps) => {
  const {
    isSelected,
    isHighlighted,
    isFiltered,
    objectCount,
    handleSelect,
    handleToggleCategoryVisibility,
  } = useImageViewerCategoryItemState(category, kind);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleOpenCategoryMenu(event, category);
  };

  return (
    <CustomListItemButton
      selected={isSelected}
      primaryText={category.name}
      icon={
        <Checkbox
          checked={!isFiltered}
          checkedIcon={<LabelIcon />}
          disableRipple
          edge="start"
          sx={{
            color: category.color,
            py: 0,
            "&.Mui-checked": { color: category.color },
          }}
          icon={<LabelOutlinedIcon />}
          tabIndex={-1}
          onChange={(event) =>
            handleToggleCategoryVisibility(event, category.id)
          }
          size="small"
        />
      }
      sx={{
        backgroundColor: isHighlighted ? category.color + "33" : "inherit",
      }}
      onClick={handleSelect}
      secondaryIcon={<MoreHorizIcon />} //TODO: Fix Display -- on load buttons offset, then move after interaction
      onSecondary={handleOpenMenu}
      additionalComponent={
        <Chip
          label={objectCount}
          size="small"
          sx={(theme) => {
            return {
              height: "1.5em",
              minWidth: "2.5em",
              borderWidth: "2px",
              fontSize: "0.875rem",
              color: theme.palette.text.primary,
              backgroundColor: APPLICATION_COLORS.highlightColor,
            };
          }}
        />
      }
      dense
    />
  );
};
