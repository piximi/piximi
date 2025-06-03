import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Chip, Tooltip } from "@mui/material";
import { LabelOutlined as LabelOutlinedIcon } from "@mui/icons-material";

import { ImageCategoryMenu } from "./ImageCategoryMenu";

import { dataSlice } from "store/data";
import { isUnknownCategory } from "store/data/utils";
import { selectActiveCategories } from "store/project/reselectors";

import { Partition } from "utils/models/enums";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const CategorizeChip = ({
  unfilteredSelectedThings,
}: {
  unfilteredSelectedThings: string[];
}) => {
  const dispatch = useDispatch();
  const categories = useSelector(selectActiveCategories);
  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const onOpenCategoriesMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };
  const handleUpdateCategories = (categoryId: string) => {
    const updates = unfilteredSelectedThings.map((thingId) => ({
      id: thingId,
      categoryId: categoryId,
      partition: isUnknownCategory(categoryId)
        ? Partition.Inference
        : Partition.Unassigned,
    }));
    dispatch(
      dataSlice.actions.updateThings({
        updates,
      }),
    );
  };
  return (
    <>
      <Tooltip
        title={
          unfilteredSelectedThings.length === 0
            ? "Select Objects to Categorize"
            : "Categorize Selection"
        }
      >
        <span>
          <Chip
            data-help={HelpItem.Categorize}
            avatar={<LabelOutlinedIcon color="inherit" />}
            label="Categorize"
            onClick={onOpenCategoriesMenu}
            variant="outlined"
            sx={{ marginRight: 1 }}
            disabled={unfilteredSelectedThings.length === 0}
          />
        </span>
      </Tooltip>
      <ImageCategoryMenu
        anchorEl={categoryMenuAnchorEl as HTMLElement}
        selectedIds={unfilteredSelectedThings}
        onClose={onCloseCategoryMenu}
        open={Boolean(categoryMenuAnchorEl as HTMLElement)}
        onUpdateCategories={handleUpdateCategories}
        categories={categories}
      />
    </>
  );
};
