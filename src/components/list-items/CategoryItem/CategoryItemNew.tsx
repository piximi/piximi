import React from "react";

import {
  Label as LabelIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";

import { CustomListItemButton } from "../CustomListItemButton";
import { useSelector } from "react-redux";
import { selectNumThingsByCatAndKind } from "store/data/selectors";
import { selectActiveKindId } from "store/project/selectors";
import { CountChip } from "components/styled-components";
import { APPLICATION_COLORS } from "utils/common/constants";
import { Category } from "store/data/types";

type CategoryItemProps = {
  category: Category;
  isSelected: boolean;
  isHighlighted: boolean;
  selectCategory: (category: Category) => void;
  handleOpenCategoryMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    category: Category
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
  const activeKind = useSelector(selectActiveKindId);

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
        <CountChip
          count={numThings(category.id, activeKind)}
          backgroundColor={APPLICATION_COLORS.highlightColor}
        />
      }
      dense
    />
  );
};
