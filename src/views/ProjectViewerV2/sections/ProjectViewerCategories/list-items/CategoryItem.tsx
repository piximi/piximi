import React from "react";

import { Tooltip } from "@mui/material";
import {
  Label as LabelIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";

import { CustomListItemButton } from "components/ui/CustomListItemButton";
import { CountChip } from "components/ui/CountChip";

import type { Category } from "store/dataV2/types";
import { useParameterizedSelector } from "store/hooks";
import { selectEntityCountByCategoryId } from "store/dataV2/selectors";

import { APPLICATION_COLORS } from "utils/constants";

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
  const tipRef = React.useRef(null);
  const [inView, setInView] = React.useState(false);
  const numEntities = useParameterizedSelector(
    selectEntityCountByCategoryId,
    category.id,
  );

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleOpenCategoryMenu(event, category);
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
      slotProps={{ popper: { sx: { display: inView ? "block" : "none" } } }}
    >
      <span>
        <CustomListItemButton
          primaryText={category.name}
          icon={<LabelIcon sx={{ color: category.color }} />}
          sx={{
            bgcolor: isHighlighted ? category.color + "33" : "inherit",
            cursor: "default",
          }}
          onClick={undefined}
          secondaryIcon={<MoreHorizIcon />}
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
