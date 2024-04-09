import React from "react";

import { Checkbox } from "@mui/material";
import {
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";

import { CustomListItemButton } from "../CustomListItemButton";
import { useImageViewerCategoryItemState } from "./useImageViewerCategoryItemState";
import { CategoryItemMenuNew } from "components/menus";
import { CountChip } from "components/styled-components";
import { APPLICATION_COLORS } from "utils/common/constants";
import { NewCategory } from "store/data/types";

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
          <CountChip
            count={objectCount}
            backgroundColor={APPLICATION_COLORS.highlightColor}
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
