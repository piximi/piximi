import React, { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { IconButton, List, Stack } from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialogHotkey, useHotkeys } from "hooks";

import { ConfirmationDialog } from "components/dialogs";
import { CategoryItemMenu } from "components/ui/CategoryItemMenuV2";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { FunctionalDivider } from "components/ui";
import { TooltipWithDisable } from "components/ui/tooltips/TooltipWithDisable";
import { CategoryDialog } from "components/dialogs/CategoryDialogV2";

import { projectSlice } from "@ProjectViewer/state";
import {
  selectActiveSelectedIds,
  selectActiveView,
  selectActiveKindId,
} from "@ProjectViewer/state/selectors";
import { selectActiveCategories } from "@ProjectViewer/state/reselectors";
import type { Category } from "store/dataV2/types";
import { generateCategory } from "store/dataV2/utils";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";

import { HotkeyContext } from "utils/enums";

import { CategoryItem } from "./list-items/CategoryItem";

export const ProjectViewerCategories = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectActiveCategories);
  const activeView = useSelector(selectActiveView);
  const activeKindId = useSelector(selectActiveKindId);
  const selectedEntityIds = useSelector(selectActiveSelectedIds);

  const [categoryIndex, setCategoryIndex] = useState("");
  const [showHK, setShowHK] = useState(false);
  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const [menuCategory, setMenuCategory] = useState<Category>();

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

  const createCategory = (name: string, color: string) => {
    const category = generateCategory(
      name,
      color,
      activeView === "images"
        ? { type: "image" }
        : { type: "annotation", kindId: activeKindId },
    );
    dispatch(dataSliceV2.actions.addCategory(category));
  };

  const editCategory = (id: string, name: string, color: string) => {
    dispatch(
      dataSliceV2.actions.updateCategoryDisplayProps({
        id,
        changes: { name, color },
      }),
    );
  };
  const deleteCategory = (category: Category) => {
    dispatch(dataSliceV2.actions.deleteCategory(category.id));
  };
  const deleteObjects = (category: Category) => {
    dispatch(dataSliceV2.actions.deleteEntitiesByCatId(category.id));
  };

  const onOpenCategoryMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    category: Category,
  ) => {
    setMenuCategory(category);
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setMenuCategory(undefined);
    setCategoryMenuAnchorEl(null);
  };
  const handleRemoveAllCategories = () => {
    dispatch(
      dataSliceV2.actions.batchDeleteCategory(categories.map((c) => c.id)),
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
      if (categoryIndex.length === 0 && Number.isNaN(+categoryIndex)) return;
      const currentCategory = categories[+categoryIndex];
      if (currentCategory) {
        if (selectedEntityIds.length > 0) {
          const updates = selectedEntityIds.map((id) => ({
            id,
            categoryId: currentCategory.id,
          }));
          if (activeView === "images") {
            dispatch(dataSliceV2.actions.batchUpdateImageCategory(updates));
            return;
          }
          dispatch(
            dataSliceV2.actions.batchBubbleUpdateAnnotationCategory(updates),
          );
        }
      }

      setCategoryIndex("");
    },
    [HotkeyContext.ProjectView],
    { keyup: true, enabled: true },
    [dispatch, selectedEntityIds],
  );

  useHotkeys(
    "shift",
    () => {
      setShowHK(true);
    },
    [HotkeyContext.ProjectView],
    { enabled: true },
    [dispatch, selectedEntityIds],
  );

  useEffect(() => {
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
    }
  }, [dispatch, categoryIndex, categories]);

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
              isHighlighted={String(idx) === categoryIndex}
              handleOpenCategoryMenu={onOpenCategoryMenu}
            />
          );
        })}
      </List>

      {menuCategory && (
        <CategoryItemMenu
          anchorElCategoryMenu={categoryMenuAnchorEl}
          category={menuCategory}
          handleCloseCategoryMenu={onCloseCategoryMenu}
          openCategoryMenu={Boolean(categoryMenuAnchorEl)}
          editCategory={editCategory}
          deleteCategory={deleteCategory}
          clearObjects={deleteObjects}
        />
      )}

      <CategoryDialog
        kind={activeKindId}
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
