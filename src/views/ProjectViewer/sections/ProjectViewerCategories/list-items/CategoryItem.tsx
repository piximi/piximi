import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useSelector } from "react-redux";

import type { Theme } from "@mui/material";
import { lighten, darken, Tooltip } from "@mui/material";
import {
  Label as CategoryIcon,
  LabelOutlined as FilteredCategoryIcon,
  MoreHoriz as MoreIcon,
} from "@mui/icons-material";

import { CustomListItemButton } from "components/ui/CustomListItemButton";
import { CountChip } from "components/ui/CountChip";

import type { Category } from "store/dataV2/types";
import { useParameterizedSelector } from "store/hooks";
import { selectEntityCountByCategoryId } from "store/dataV2/selectors";
import { selectActiveFilters } from "@ProjectViewer/state/selectors";

import { APPLICATION_COLORS } from "utils/constants";
import { haloFilter } from "utils/styleUtils";

type CategoryItemProps = {
  showHK?: boolean;
  HKIndex?: number;
  category: Category;
  isHighlighted: boolean;
  handleOpenCategoryMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    category: Category,
  ) => void;
};

export const CategoryItem = ({
  showHK,
  HKIndex,
  category,
  isHighlighted,
  handleOpenCategoryMenu,
}: CategoryItemProps) => {
  const tipRef = useRef(null);
  const [inView, setInView] = useState(false);
  const numEntities = useParameterizedSelector(
    selectEntityCountByCategoryId,
    category.id,
  );
  const activeFilters = useSelector(selectActiveFilters);

  const isFiltered = useCallback(
    (category) => activeFilters.categoryId.includes(category.id),
    [activeFilters.categoryId, category],
  );

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleOpenCategoryMenu(event, category);
  };

  const cb = (entries: any) => {
    const [entry] = entries;
    entry.isIntersecting ? setInView(true) : setInView(false);
  };

  const iconStyle = useCallback(
    (theme: Theme) => {
      const augment = theme.palette.mode === "dark" ? lighten : darken;
      return {
        color: category.color,
        filter: haloFilter(augment(category.color, 0.5), 0.5),
      };
    },
    [category],
  );

  useEffect(() => {
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
      slotProps={{ popper: { sx: { display: inView ? "block" : "none" } } }}
    >
      <span>
        <CustomListItemButton
          primaryText={category.name}
          icon={
            isFiltered(category) ? (
              <FilteredCategoryIcon sx={iconStyle} />
            ) : (
              <CategoryIcon sx={iconStyle} />
            )
          }
          sx={{
            bgcolor: isHighlighted ? category.color + "33" : "inherit",
            cursor: "default",
          }}
          onClick={undefined}
          secondaryIcon={<MoreIcon />}
          onSecondary={handleOpenMenu}
          additionalComponent={
            <CountChip
              count={numEntities}
              backgroundColor={APPLICATION_COLORS.highlightColor}
            />
          }
          dense
        />
      </span>
    </Tooltip>
  );
};
