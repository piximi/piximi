import { useState } from "react";

import { LabelOutlined as LabelOutlinedIcon } from "@mui/icons-material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { TooltipButton, TooltipTitle } from "components/ui/tooltips";

import type { Category } from "store/dataV2/types";

import { ImageCategoryMenu } from "./ImageCategoryMenu";
import { actionButtonStyle } from "./utils";

export const CategorizeChip = ({
  selectedFilteredItems,
  handleCategorize,
  activeCategories,
}: {
  selectedFilteredItems: string[];
  handleCategorize: (catId: string) => void;
  activeCategories: Category[];
}) => {
  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    useState<null | HTMLElement>(null);

  const onOpenCategoriesMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };

  return (
    <>
      <TooltipButton
        dataHelp={HelpItem.Categorize}
        tooltipTitle={TooltipTitle(
          selectedFilteredItems.length === 0
            ? "Select Objects to Categorize"
            : "Categorize Selection",
          "C",
        )}
        color="inherit"
        disabled={selectedFilteredItems.length === 0}
        onClick={onOpenCategoriesMenu}
        icon={true}
        sx={actionButtonStyle}
      >
        <LabelOutlinedIcon color="inherit" />
      </TooltipButton>

      <ImageCategoryMenu
        anchorEl={categoryMenuAnchorEl as HTMLElement}
        selectedIds={selectedFilteredItems}
        onClose={onCloseCategoryMenu}
        open={Boolean(categoryMenuAnchorEl as HTMLElement)}
        onUpdateCategories={handleCategorize}
        categories={activeCategories}
      />
    </>
  );
};
