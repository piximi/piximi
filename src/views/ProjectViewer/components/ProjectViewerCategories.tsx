import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton, List, Stack } from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialogHotkey, useHotkeys } from "hooks";

import { ConfirmationDialog, CategoryDialog } from "components/dialogs";
import { CategoryItemMenu } from "components/ui/CategoryItemMenu";
import { CategoryItem } from "./list-items";

import { projectSlice } from "store/project";
import {
  selectAllActiveSelectedKindItemIds,
  selectActiveCategory,
} from "store/project/selectors";
import { selectActiveKindId } from "store/project/selectors";
import { selectActiveCategories } from "store/project/reselectors";
import { dataSlice } from "store/data/dataSlice";

import { generateCategory, isUnknownCategory } from "store/data/utils";

import { Partition } from "utils/models/enums";
import { HotkeyContext } from "utils/enums";

import { Category } from "store/data/types";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { FunctionalDivider } from "components/ui";
import { TooltipWithDisable } from "components/ui/tooltips/TooltipWithDisable";
import { useKindOperations } from "contexts/KindItemsProvider";

export const ProjectViewerCategories = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectActiveCategories);
  const activeKind = useSelector(selectActiveKindId);

  const [selectedCategory, setSelectedCategory] = useState<Category>();
  const [categoryIndex, setCategoryIndex] = useState("");
  const [showHK, setShowHK] = useState(false);

  const highlightedCategory = useSelector(selectActiveCategory);
  const activeSelectedKindItemIds = useSelector(
    selectAllActiveSelectedKindItemIds,
  );

  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const {
    deleteKindItemsOfCategory,
    categorizeSelectedKindItems,
    repartitionSelectedKindItems,
  } = useKindOperations();

  const hasSelectedItems = useMemo(() => {
    if (Array.isArray(activeSelectedKindItemIds)) {
      return activeSelectedKindItemIds.length > 0;
    }
    return Object.keys(activeSelectedKindItemIds).length > 0;
  }, [activeSelectedKindItemIds]);

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
        projectSlice.actions.changeActiveCategory({
          categoryId: category.id,
        }),
      );
    },
    [dispatch],
  );

  const createCategory = (kind: string, name: string, color: string) => {
    dispatch(
      dataSlice.actions.addCategory(generateCategory(name, kind, color)),
    );
  };

  const editCategory = (id: string, name: string, color: string) => {
    dispatch(
      dataSlice.actions.updateCategory({
        id,
        changes: { name, color },
      }),
    );
  };
  const deleteCategory = (category: Category) => {
    dispatch(dataSlice.actions.deleteCategoryCascade(category.id));
  };

  const onOpenCategoryMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    category: Category,
  ) => {
    selectCategory(category);
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };
  const handleRemoveAllCategories = () => {
    dispatch(dataSlice.actions.batchDeleteCategoriesByKind(activeKind));
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
    [HotkeyContext.ProjectView],

    [],
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
    [],
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
          projectSlice.actions.changeActiveCategory({
            categoryId: categories[+categoryIndex].id,
          }),
        );
        setSelectedCategory(categories[+categoryIndex]);
        if (hasSelectedItems && highlightedCategory) {
          categorizeSelectedKindItems(
            activeSelectedKindItemIds,
            highlightedCategory,
          );
          repartitionSelectedKindItems(
            activeSelectedKindItemIds,
            Partition.Unassigned,
          );
        }
      }

      setCategoryIndex("");
    },
    [HotkeyContext.ProjectView],
    { keyup: true, enabled: true },
    [dispatch, activeSelectedKindItemIds],
  );

  useHotkeys(
    "shift",
    () => {
      setShowHK(true);
    },
    [HotkeyContext.ProjectView],
    { enabled: true },
    [dispatch, activeSelectedKindItemIds],
  );

  useEffect(() => {
    const allCategories = categories;
    if (
      categoryIndex.length !== 0 &&
      !Number.isNaN(+categoryIndex) &&
      allCategories[+categoryIndex]
    ) {
      dispatch(
        projectSlice.actions.changeActiveCategory({
          categoryId: allCategories[+categoryIndex].id,
        }),
      );
    }
  }, [dispatch, categoryIndex, categories]);
  useEffect(() => {}, [selectedCategory]);

  return (
    <>
      <FunctionalDivider
        headerText="Categories"
        containerStyle={{ marginTop: 1 }}
        typographyVariant="body2"
        actions={
          <Stack direction="row">
            <TooltipWithDisable title="New Category">
              <IconButton
                data-help={HelpItem.CreateCategory}
                onClick={handleOpenCreateCategoryDialog}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </TooltipWithDisable>
            <TooltipWithDisable
              title={
                categories.length === 1
                  ? "No user created categories"
                  : "Delete all categories"
              }
            >
              <IconButton
                data-help={HelpItem.DeleteAllCategories}
                onClick={handleOpenDeleteCategoryDialog}
                disabled={categories.length === 1}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </TooltipWithDisable>
          </Stack>
        }
      />

      <List dense sx={{ maxHeight: "20rem", overflowY: "scroll", pt: 0 }}>
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

      {selectedCategory && (
        <CategoryItemMenu
          anchorElCategoryMenu={categoryMenuAnchorEl}
          category={selectedCategory}
          handleCloseCategoryMenu={onCloseCategoryMenu}
          openCategoryMenu={Boolean(categoryMenuAnchorEl)}
          editCategory={editCategory}
          deleteCategory={deleteCategory}
          clearObjects={deleteKindItemsOfCategory}
        />
      )}

      <CategoryDialog
        kind={activeKind}
        onConfirm={createCategory}
        onClose={handleCloseCreateCategoryDialog}
        open={isCreateCategoryDialogOpen}
        action={"create"}
      />

      <ConfirmationDialog
        title="Delete All Categories"
        content={`Associated objects will NOT be deleted, and instead be labelled as "Unknown"`}
        onConfirm={handleRemoveAllCategories}
        onClose={handleCloseDeleteCategoryDialog}
        isOpen={isDeleteCategoryDialogOpen}
      />
    </>
  );
};
