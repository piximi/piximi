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
import { CategoryItemMenuNew } from "components/menus/CategoryItemMenu/CategoryItemMenuNew";

type ImageViewerCategoryItemProps = {
  category: NewCategory;
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
  } = useImageViewerCategoryItemState(category, kind);
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
      <CategoryItemMenuNew
        anchorElCategoryMenu={categoryMenuAnchorEl}
        category={category}
        handleCloseCategoryMenu={handleCloseMenu}
        openCategoryMenu={Boolean(categoryMenuAnchorEl)}
        menuFunctions={{
          "Clear Objects": { imageViewer: true, permanent: false },
          Delete: { permanent: false },
        }}
      />
    </>
  );
};
