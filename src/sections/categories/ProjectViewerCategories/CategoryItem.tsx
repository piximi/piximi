import React from "react";
import { useSelector } from "react-redux";
import { Tooltip } from "@mui/material";
import {
  Label as LabelIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";

import { CustomListItemButton } from "components/CustomListItemButton";
import { CountChip } from "components/CountChip";

import { selectNumThingsByCatAndKind } from "store/data/selectors";
import { selectActiveKindId } from "store/project/selectors";

import { APPLICATION_COLORS } from "utils/common/constants";

import { Category } from "store/data/types";

type CategoryItemProps = {
  showHK?: boolean;
  HKIndex?: number;
  category: Category;
  isSelected: boolean;
  isHighlighted: boolean;
  selectCategory: (category: Category) => void;
  handleOpenCategoryMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    category: Category
  ) => void;
};

export const CategoryItem = ({
  showHK,
  HKIndex,
  category,
  isSelected,
  isHighlighted,
  handleOpenCategoryMenu,
  selectCategory,
}: CategoryItemProps) => {
  const tipRef = React.useRef(null);
  const [inView, setInView] = React.useState(false);
  const numThings = useSelector(selectNumThingsByCatAndKind);
  const activeKind = useSelector(selectActiveKindId);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleOpenCategoryMenu(event, category);
  };
  const handleSelect = () => {
    selectCategory(category);
  };
  const cb = (entries: any) => {
    const [entry] = entries;
    entry.isIntersecting ? setInView(true) : setInView(false);
  };

  React.useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
    };
    const ref = tipRef.current;
    const observer = new IntersectionObserver(cb, options);

    if (ref) observer.observe(ref);

    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [tipRef]);

  return (
    <Tooltip
      ref={tipRef}
      open={showHK}
      title={HKIndex}
      placement="right"
      PopperProps={{
        sx: { display: inView ? "block" : "none" },
      }}
    >
      <span>
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
      </span>
    </Tooltip>
  );
};
