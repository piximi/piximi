import React, { useMemo } from "react";
import { Checkbox } from "@mui/material";
import {
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";

import { useImageViewerCategoryItemState } from "../hooks";

import { CustomListItemButton } from "components/ui/CustomListItemButton";
import { CountChip } from "components/ui/CountChip";
import { CategoryItemMenu } from "components/categories/CategoryItemMenu";

import { APPLICATION_COLORS } from "utils/common/constants";

import { Category } from "store/data/types";
import { useDispatch } from "react-redux";
import { imageViewerSlice } from "store/imageViewer";
import { dataSlice } from "store/data";

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
  } = useImageViewerCategoryItemState(category, kind);

  const dispatch = useDispatch();
  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setCategoryMenuAnchorEl(null);
  };

  const menuFunctions = useMemo(
    () => ({
      "Clear Objects": () => {
        dispatch(
          imageViewerSlice.actions.removeActiveAnnotationIds({
            annotationIds: category.containing,
          })
        );
        dispatch(
          dataSlice.actions.deleteThings({
            ofCategories: [category.id],
            activeKind: kind,
            isPermanent: false,
            disposeColorTensors: true,
          })
        );
      },
      Delete: { permanent: false },
    }),
    [category.containing, kind, dispatch, category.id]
  );

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
      <CategoryItemMenu
        kind={kind}
        anchorElCategoryMenu={categoryMenuAnchorEl}
        category={category}
        handleCloseCategoryMenu={handleCloseMenu}
        openCategoryMenu={Boolean(categoryMenuAnchorEl)}
        menuFunctions={menuFunctions}
      />
    </>
  );
};
