import React from "react";
import { Checkbox } from "@mui/material";
import {
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";

import { useImageViewerCategoryItemState } from "../hooks";

import { CustomListItemButton, CountChip } from "components/ui/";
import { CategoryItemMenu } from "components/ui/CategoryItemMenu";

import { APPLICATION_COLORS } from "utils/constants";

import { Category } from "store/data/types";

type ImageViewerCategoryItemProps = {
  category: Category;
  kind: string;
};

export const ImageViewerCategoryItem = ({
  category,
  kind,
}: ImageViewerCategoryItemProps) => {
  const {
    isSelected,
    isHighlighted,
    isFiltered,
    objectCount,
    handleSelect,
    handleToggleCategoryVisibility,
    editCategory,
    deleteCategory,
    clearObjects,
  } = useImageViewerCategoryItemState(category);

  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setCategoryMenuAnchorEl(null);
  };

  return (
    <>
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
          pl: 2,
        }}
        onClick={handleSelect}
        secondaryIcon={<MoreHorizIcon />} //TODO: Fix Display -- on load buttons offset, then move after interaction
        onSecondary={handleOpenMenu}
        additionalComponent={
          <CountChip
            count={objectCount}
            backgroundColor={APPLICATION_COLORS.highlightColor}
          />
        }
        dense
      />
      <CategoryItemMenu
        kind={kind}
        anchorElCategoryMenu={categoryMenuAnchorEl}
        category={category}
        handleCloseCategoryMenu={handleCloseMenu}
        openCategoryMenu={Boolean(categoryMenuAnchorEl)}
        editCategory={editCategory}
        deleteCategory={deleteCategory}
        clearObjects={clearObjects}
      />
    </>
  );
};
