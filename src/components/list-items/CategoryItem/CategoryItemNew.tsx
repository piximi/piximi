import React from "react";

import { Chip } from "@mui/material";
import {
  Label as LabelIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";

import { APPLICATION_COLORS } from "utils/common/colorPalette";
import { CustomListItemButton } from "../CustomListItemButton";
import { NewCategory } from "types/Category";
import { useSelector } from "react-redux";
import { selectNumThingsByCatAndKind } from "store/slices/newData/selectors/reselectors";
import { selectActiveKind } from "store/slices/project/selectors";

type CategoryItemProps = {
  category: NewCategory;
  isSelected: boolean;
  isHighlighted: boolean;
  selectCategory: (category: NewCategory) => void;
  handleOpenCategoryMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    category: NewCategory
  ) => void;
};

export const CategoryItemNew = ({
  category,
  isSelected,
  isHighlighted,
  handleOpenCategoryMenu,
  selectCategory,
}: CategoryItemProps) => {
  const numThings = useSelector(selectNumThingsByCatAndKind);
  const activeKind = useSelector(selectActiveKind);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleOpenCategoryMenu(event, category);
  };
  const handleSelect = () => {
    selectCategory(category);
  };

  return (
    <CustomListItemButton
      selected={isSelected}
      primaryText={category.name}
      icon={<LabelIcon sx={{ color: category.color }} />}
      sx={{
        backgroundColor: isHighlighted ? category.color + "33" : "inherit",
      }}
      onClick={handleSelect}
      secondaryIcon={<MoreHorizIcon />}
      onSecondary={handleOpenMenu}
      additionalComponent={
        <Chip
          label={numThings(category.id, activeKind)}
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
