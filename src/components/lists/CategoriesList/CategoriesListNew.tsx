import React, { useCallback, useEffect, useState } from "react";

import { List } from "@mui/material";

import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialogHotkey, useHotkeys } from "hooks";

import { DialogWithAction } from "components/dialogs";

import { HotkeyView, Partition } from "types";
import { NewCategory } from "types/Category";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveCategories,
  selectActiveUnknownCategory,
} from "store/slices/newData/selectors/reselectors";
import { CategoryItemNew } from "components/list-items/CategoryItem/CategoryItemNew";
import { CategoryItemMenuNew } from "components/menus/CategoryItemMenu/CategoryItemMenuNew";
import {
  projectSlice,
  selectHighlightedImageCategory,
  selectSelectedImageIds,
} from "store/slices/project";
import { selectActiveKindId } from "store/slices/project/selectors";
import { CreateCategoryDialogNew } from "components/dialogs/CreateCategoryDialogNew/CreateCategoryDialogNew";
import { selectClassifierModelStatus } from "store/slices/classifier";
import { ModelStatus } from "types/ModelType";
import { newDataSlice } from "store/slices/newData/newDataSlice";
import { PredictionListItemsNew } from "components/list-items/PredictionListItems/PredictionListItemsNew";
import { isUnknownCategory } from "utils/common/helpers";

export const CategoriesListNew = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectActiveCategories);
  const activeUnknownCategory = useSelector(selectActiveUnknownCategory);
  const activeKind = useSelector(selectActiveKindId);
  const [selectedCategory, setSelectedCategory] = useState<NewCategory>();
  const [categoryIndex, setCategoryIndex] = useState("");

  const highlightedCategory = useSelector(selectHighlightedImageCategory);
  const modelStatus = useSelector(selectClassifierModelStatus);
  const selectedImageIds = useSelector(selectSelectedImageIds);

  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const {
    onClose: handleCloseCreateCategoryDialog,
    onOpen: handleOpenCreateCategoryDialog,
    open: isCreateCategoryDialogOpen,
  } = useDialogHotkey(HotkeyView.DialogWithAction);

  const {
    onClose: handleCloseDeleteCategoryDialog,
    onOpen: handleOpenDeleteCategoryDialog,
    open: isDeleteCategoryDialogOpen,
  } = useDialogHotkey(HotkeyView.DialogWithAction);

  const selectCategory = useCallback(
    (category: NewCategory) => {
      setSelectedCategory(category);

      dispatch(
        projectSlice.actions.updateHighlightedImageCategory({
          categoryId: category.id,
        })
      );
    },
    [dispatch]
  );

  const onOpenCategoryMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    category: NewCategory
  ) => {
    selectCategory(category);
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };
  const handleRemoveAllCategories = () => {
    dispatch(
      newDataSlice.actions.removeCategoriesFromKind({
        categoryIds: "all",
        kind: activeKind,
        isPermanent: true,
      })
    );
  };

  useHotkeys(
    "shift+1,shift+2,shift+3,shift+4,shift+5,shift+6,shift+7,shift+8,shift+9,shift+0",
    (event: any, _handler) => {
      if (!event.repeat) {
        setCategoryIndex((index) => {
          return index + _handler.key.at(-1)!.toString();
        });
      }
    },
    [HotkeyView.Annotator, HotkeyView.ProjectView],

    []
  );

  useHotkeys(
    "shift+backspace",
    (event) => {
      if (!event.repeat) {
        setCategoryIndex((index) => {
          return index.slice(0, index.length - 1);
        });
      }
    },
    [HotkeyView.ProjectView],
    []
  );

  useHotkeys(
    "shift",
    () => {
      if (selectedImageIds.length > 0) {
        dispatch(
          newDataSlice.actions.updateThings({
            updates: selectedImageIds.map((imageId) => ({
              id: imageId,
              categoryId: highlightedCategory,
              partition: Partition.Unassigned,
            })),
            isPermanent: true,
          })
        );
      }

      setCategoryIndex("");
    },
    [HotkeyView.Annotator, HotkeyView.ProjectView],
    { keyup: true, enabled: true },
    [dispatch, selectedImageIds]
  );

  useEffect(() => {
    const allCategories = categories;
    if (categoryIndex.length === 0) {
      dispatch(
        projectSlice.actions.updateHighlightedImageCategory({
          categoryId: undefined,
        })
      );
    } else if (!Number.isNaN(+categoryIndex) && allCategories[+categoryIndex]) {
      dispatch(
        projectSlice.actions.updateHighlightedImageCategory({
          categoryId: allCategories[+categoryIndex].id,
        })
      );
    }
  }, [dispatch, categoryIndex, categories]);

  return (
    <>
      <List dense>
        <List dense sx={{ maxHeight: "20rem", overflowY: "scroll" }}>
          {categories.map((category: NewCategory) => {
            return (
              <CategoryItemNew
                category={category}
                key={category.id}
                isSelected={
                  selectedCategory
                    ? selectedCategory.id === category.id
                    : isUnknownCategory(category.id)
                }
                selectCategory={selectCategory}
                isHighlighted={highlightedCategory === category.id}
                handleOpenCategoryMenu={onOpenCategoryMenu}
              />
            );
          })}
        </List>

        {modelStatus === ModelStatus.Suggesting && <PredictionListItemsNew />}
        <CustomListItemButton
          icon={<AddIcon />}
          primaryText="Create Category"
          onClick={handleOpenCreateCategoryDialog}
          dense
        />
        <CustomListItemButton
          icon={
            <DeleteIcon
              color={categories.length > 0 ? "inherit" : "disabled"}
            />
          }
          primaryText="Delete all categories"
          onClick={handleOpenDeleteCategoryDialog}
          dense
          disabled={categories.length === 0}
          tooltipText={
            categories.length === 0 ? "No user created categories" : undefined
          }
        />
      </List>

      <CategoryItemMenuNew
        anchorElCategoryMenu={categoryMenuAnchorEl}
        category={selectedCategory ?? activeUnknownCategory}
        handleCloseCategoryMenu={onCloseCategoryMenu}
        openCategoryMenu={Boolean(categoryMenuAnchorEl)}
      />
      <CreateCategoryDialogNew
        kind={activeKind}
        onClose={handleCloseCreateCategoryDialog}
        open={isCreateCategoryDialogOpen}
      />

      <DialogWithAction
        title="Delete All Categories"
        content={`Affected objects will NOT be deleted, and instead be labelled as "Unknown"`}
        onConfirm={handleRemoveAllCategories}
        onClose={handleCloseDeleteCategoryDialog}
        isOpen={isDeleteCategoryDialogOpen}
      />
    </>
  );
};
