import React, { useCallback, useEffect, useState } from "react";

import { List } from "@mui/material";

import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialogHotkey, useHotkeys } from "hooks";

import { ConfirmationDialog } from "components/dialogs";

import { CustomListItemButton } from "components/list-items";
import { useDispatch, useSelector } from "react-redux";
import { CategoryItem } from "components/list-items";
import { CategoryItemMenu } from "components/menus";
import { projectSlice } from "store/project";
import { selectHighlightedCategory } from "store/project/selectors";
import { selectActiveKindId } from "store/project/selectors";
import { CreateCategoryDialog } from "components/dialogs";
import { dataSlice } from "store/data/dataSlice";
import { PredictionListItems } from "components/list-items";
import { isUnknownCategory } from "utils/common/helpers";
import { ModelStatus, Partition } from "utils/models/enums";
import { HotkeyContext } from "utils/common/enums";
import { Category } from "store/data/types";
import {
  selectActiveCategories,
  selectActiveSelectedThingIds,
} from "store/project/reselectors";
import { selectClassifierModelStatus } from "store/classifier/selectors";

export const CategoriesList = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectActiveCategories);
  const activeKind = useSelector(selectActiveKindId);

  const [selectedCategory, setSelectedCategory] = useState<Category>();
  const [categoryIndex, setCategoryIndex] = useState("");
  const [showHK, setShowHK] = useState(false);

  const highlightedCategory = useSelector(selectHighlightedCategory);

  const modelStatus = useSelector(selectClassifierModelStatus);
  const selectedImageIds = useSelector(selectActiveSelectedThingIds);

  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const {
    onClose: handleCloseCreateCategoryDialog,
    onOpen: handleOpenCreateCategoryDialog,
    open: isCreateCategoryDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const {
    onClose: handleCloseDeleteCategoryDialog,
    onOpen: handleOpenDeleteCategoryDialog,
    open: isDeleteCategoryDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const selectCategory = useCallback(
    (category: Category) => {
      setSelectedCategory(category);

      dispatch(
        projectSlice.actions.updateHighlightedCategory({
          categoryId: category.id,
        })
      );
    },
    [dispatch]
  );

  const onOpenCategoryMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    category: Category
  ) => {
    selectCategory(category);
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };
  const handleRemoveAllCategories = () => {
    dispatch(
      dataSlice.actions.removeCategoriesFromKind({
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
    [HotkeyContext.AnnotatorView, HotkeyContext.ProjectView],

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
    [HotkeyContext.ProjectView],
    []
  );

  useHotkeys(
    "shift",
    () => {
      setShowHK(false);
      if (
        categoryIndex.length !== 0 &&
        !Number.isNaN(+categoryIndex) &&
        categories[+categoryIndex]
      ) {
        dispatch(
          projectSlice.actions.updateHighlightedCategory({
            categoryId: categories[+categoryIndex].id,
          })
        );
        setSelectedCategory(categories[+categoryIndex]);
      }
      if (selectedImageIds.length > 0) {
        dispatch(
          dataSlice.actions.updateThings({
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
    [HotkeyContext.AnnotatorView, HotkeyContext.ProjectView],
    { keyup: true, enabled: true },
    [dispatch, selectedImageIds]
  );

  useHotkeys(
    "shift",
    () => {
      setShowHK(true);
    },
    [HotkeyContext.AnnotatorView, HotkeyContext.ProjectView],
    { enabled: true },
    [dispatch, selectedImageIds]
  );

  useEffect(() => {
    const allCategories = categories;
    if (
      categoryIndex.length !== 0 &&
      !Number.isNaN(+categoryIndex) &&
      allCategories[+categoryIndex]
    ) {
      dispatch(
        projectSlice.actions.updateHighlightedCategory({
          categoryId: allCategories[+categoryIndex].id,
        })
      );
    }
  }, [dispatch, categoryIndex, categories]);
  useEffect(() => {}, [selectedCategory]);

  return (
    <>
      <List dense>
        <List dense sx={{ maxHeight: "20rem", overflowY: "scroll" }}>
          {categories.map((category: Category, idx) => {
            return (
              <CategoryItem
                showHK={showHK}
                HKIndex={idx}
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

        {modelStatus === ModelStatus.Suggesting && <PredictionListItems />}
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
      {selectedCategory && (
        <CategoryItemMenu
          anchorElCategoryMenu={categoryMenuAnchorEl}
          category={selectedCategory}
          handleCloseCategoryMenu={onCloseCategoryMenu}
          openCategoryMenu={Boolean(categoryMenuAnchorEl)}
        />
      )}

      <CreateCategoryDialog
        kind={activeKind}
        onClose={handleCloseCreateCategoryDialog}
        open={isCreateCategoryDialogOpen}
        changesPermanent={true}
      />

      <ConfirmationDialog
        title="Delete All Categories"
        content={`Affected objects will NOT be deleted, and instead be labelled as "Unknown"`}
        onConfirm={handleRemoveAllCategories}
        onClose={handleCloseDeleteCategoryDialog}
        isOpen={isDeleteCategoryDialogOpen}
      />
    </>
  );
};
