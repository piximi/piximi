import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { Chip, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { LabelOutlined as LabelOutlinedIcon } from "@mui/icons-material";

import { ImageCategoryMenu } from "./ImageCategoryMenu";

import {
  selectActiveCategories,
  selectActiveFilteresSelectedKindItemIds,
} from "store/project/reselectors";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { useKindOperations } from "contexts/KindItemsProvider";

export const CategorizeChip = () => {
  const theme = useTheme();
  const categories = useSelector(selectActiveCategories);
  const selectedItems = useSelector(selectActiveFilteresSelectedKindItemIds);

  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    useState<null | HTMLElement>(null);

  const { categorizeSelectedKindItems } = useKindOperations();
  const smOrXsBreakpoint = useMediaQuery(theme.breakpoints.down("md"));

  const onOpenCategoriesMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };

  const updateKindItems = useCallback(
    (categoryId: string) => {
      categorizeSelectedKindItems(selectedItems, categoryId);
    },
    [selectedItems],
  );

  return (
    <>
      <Tooltip
        title={
          selectedItems.length === 0
            ? "Select Objects to Categorize"
            : "Categorize Selection"
        }
      >
        <span>
          <Chip
            data-help={HelpItem.Categorize}
            avatar={<LabelOutlinedIcon color="inherit" />}
            label={smOrXsBreakpoint ? "" : "Categorize"}
            onClick={onOpenCategoriesMenu}
            variant="outlined"
            sx={{ mr: 1, pl: smOrXsBreakpoint ? 1 : 0 }}
            disabled={selectedItems.length === 0}
            size="small"
          />
        </span>
      </Tooltip>
      <ImageCategoryMenu
        anchorEl={categoryMenuAnchorEl as HTMLElement}
        onClose={onCloseCategoryMenu}
        open={Boolean(categoryMenuAnchorEl as HTMLElement)}
        onUpdateCategories={updateKindItems}
        categories={categories}
      />
    </>
  );
};
