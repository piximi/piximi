import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton, List, Stack } from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialogHotkey, useHotkeys } from "hooks";

import { ConfirmationDialog, CategoryDialog } from "components/dialogs";
import { CategoryItemMenu } from "components/ui/CategoryItemMenu";
import { CategoryItem } from "./list-items/CategoryItem";

import { projectSlice } from "store/project";
import { selectHighlightedCategory } from "store/project/selectors";
import { selectActiveKindId } from "store/project/selectors";
import {
  selectActiveCategories,
  selectActiveSelectedThingIds,
} from "store/project/reselectors";
import { dataSlice } from "store/data/dataSlice";

import { isUnknownCategory } from "store/data/utils";

import { Partition } from "utils/models/enums";
import { HotkeyContext } from "utils/enums";

import { Category } from "store/data/types";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { FunctionalDivider } from "components/ui";
import { TooltipWithDisable } from "components/ui/tooltips/TooltipWithDisable";

export const ProjectViewerCategories = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectActiveCategories);
  const activeKind = useSelector(selectActiveKindId);

  const [selectedCategory, setSelectedCategory] = useState<Category>();
  const [categoryIndex, setCategoryIndex] = useState("");
  const [showHK, setShowHK] = useState(false);

  const highlightedCategory = useSelector(selectHighlightedCategory);

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
        }),
      );
    },
    [dispatch],
  );

  const createCategory = (kind: string, name: string, color: string) => {
    dispatch(
      dataSlice.actions.createCategory({
        name,
        color,
        kind: kind,
      }),
    );
  };

  const editCategory = (id: string, name: string, color: string) => {
    dispatch(
      dataSlice.actions.updateCategory({
        updates: { id, changes: { name, color } },
      }),
    );
  };
  const deleteCategory = (category: Category, kindId: string) => {
    dispatch(
      dataSlice.actions.removeCategoriesFromKind({
        categoryIds: [category.id],
        kind: kindId ?? activeKind,
      }),
    );
  };
  const deleteObjects = (category: Category) => {
    dispatch(
      dataSlice.actions.deleteThings({
        thingIds: category.containing,
        activeKind: activeKind,
        disposeColorTensors: true,
      }),
    );
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
    dispatch(
      dataSlice.actions.removeCategoriesFromKind({
        categoryIds: "all",
        kind: activeKind,
      }),
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
          projectSlice.actions.updateHighlightedCategory({
            categoryId: categories[+categoryIndex].id,
          }),
        );
        setSelectedCategory(categories[+categoryIndex]);
        if (selectedImageIds.length > 0) {
          dispatch(
            dataSlice.actions.updateThings({
              updates: selectedImageIds.map((imageId) => ({
                id: imageId,
                categoryId: highlightedCategory,
                partition: Partition.Unassigned,
              })),
            }),
          );
        }
      }

      setCategoryIndex("");
    },
    [HotkeyContext.ProjectView],
    { keyup: true, enabled: true },
    [dispatch, selectedImageIds],
  );

  useHotkeys(
    "shift",
    () => {
      setShowHK(true);
    },
    [HotkeyContext.ProjectView],
    { enabled: true },
    [dispatch, selectedImageIds],
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
            <TooltipWithDisable
              title="New Category"
              data-testid="new-category-create-button"
            >
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
          clearObjects={deleteObjects}
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
