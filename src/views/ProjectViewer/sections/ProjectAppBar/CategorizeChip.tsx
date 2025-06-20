import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Chip, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { LabelOutlined as LabelOutlinedIcon } from "@mui/icons-material";

import { ImageCategoryMenu } from "./ImageCategoryMenu";

import { dataSlice } from "store/data";
import { isUnknownCategory } from "store/data/utils";
import {
  selectActiveCategories,
  selectActiveSelectedGridAnnotations,
  selectSelectedGridImages,
} from "store/project/reselectors";

import { Partition } from "utils/models/enums";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { selectActiveKindId } from "store/project/selectors";

export const CategorizeChip = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectActiveCategories);
  const selectedImages = useSelector(selectSelectedGridImages);
  const selectedAnnotations = useSelector(selectActiveSelectedGridAnnotations);
  const activeKind = useSelector(selectActiveKindId);
  const selectedItems = useMemo(() => {
    return activeKind === "Image" ? selectedImages : selectedAnnotations;
  }, [activeKind, selectedImages, selectedAnnotations]);
  const theme = useTheme();
  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    useState<null | HTMLElement>(null);

  const smOrXsBreakpoint = useMediaQuery(theme.breakpoints.down("md"));
  const onOpenCategoriesMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };
  const handleUpdateCategories = (categoryId: string) => {
    const updates = selectedItems.map((item) => ({
      id: item.id,
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
        onUpdateCategories={handleUpdateCategories}
        categories={categories}
      />
    </>
  );
};
