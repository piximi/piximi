import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Chip,
  IconButton,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";
import { MoreHoriz as MoreHorizIcon } from "@mui/icons-material";

import { useDialog, useTranslation } from "hooks";

import { CategoryListItemCheckbox } from "../CategoryListItemCheckbox";
import { CategoryMenu } from "../CategoryMenu";
import { ClearCategoryDialog } from "../ClearCategoryDialog";
import { CreateCategoryListItem } from "../CreateCategoryListItem";
import { DeleteAllCategoriesListItem } from "../DeleteAllCategoriesListItem";
import { DeleteAllCategoriesDialog } from "../DeleteAllCategoriesDialog";
import { DeleteCategoryDialog } from "../DeleteCategoryDialog";

import { EditCategoryDialog } from "../../CategoryDialog";

import { CollapsibleList } from "components/common/CollapsibleList";

import {
  categoryCountsSelector,
  createdAnnotatorCategoriesSelector,
  selectedCategorySelector,
  unknownAnnotationCategorySelector,
} from "store/selectors";

import { imageViewerSlice } from "store/slices";

import { Category } from "types";

export const CategoriesList = () => {
  const createdCategories = useSelector(createdAnnotatorCategoriesSelector);
  const unknownAnnotationCategory = useSelector(
    unknownAnnotationCategorySelector
  );

  const selectedCategory = useSelector(selectedCategorySelector);

  const categoryCounts = useSelector(categoryCountsSelector);

  const dispatch = useDispatch();

  const {
    onClose: onCloseDeleteCategoryDialog,
    onOpen: onOpenDeleteCategoryDialog,
    open: openDeleteCategoryDialog,
  } = useDialog();

  const {
    onClose: onCloseDeleteAllCategoriesDialog,
    onOpen: onOpenDeleteAllCategoriesDialog,
    open: openDeleteAllCategoriesDialog,
  } = useDialog();

  const {
    onClose: onCloseEditCategoryDialog,
    onOpen: onOpenEditCategoryDialog,
    open: openEditCategoryDialog,
  } = useDialog();

  const {
    onClose: onCloseClearCategoryDialog,
    onOpen: onOpenClearCategoryDialog,
    open: openClearCategoryDialog,
  } = useDialog();

  const {
    onClose: onCloseDeleteAllAnnotationsDialog,
    onOpen: onOpenDeleteAllAnnotationsDialog,
    open: openDeleteAllAnnotationsDialog,
  } = useDialog();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const onCategoryClick = (
    event: React.MouseEvent<HTMLDivElement>,
    category: Category
  ) => {
    dispatch(
      imageViewerSlice.actions.setSelectedCategoryId({
        selectedCategoryId: category.id,
      })
    );
  };

  const onCategoryMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    category: Category
  ) => {
    dispatch(
      imageViewerSlice.actions.setSelectedCategoryId({
        selectedCategoryId: category.id,
      })
    );
    setAnchorEl(event.currentTarget);
  };

  const onCategoryMenuClose = () => {
    setAnchorEl(null);
  };

  const t = useTranslation();

  return (
    <CollapsibleList closed dense primary={t("Categories")}>
      {unknownAnnotationCategory && (
        <div key={unknownAnnotationCategory.id}>
          <ListItem
            button
            id={unknownAnnotationCategory.id}
            onClick={(event) =>
              onCategoryClick(event, unknownAnnotationCategory)
            }
            selected={unknownAnnotationCategory.id === selectedCategory.id}
          >
            <CategoryListItemCheckbox category={unknownAnnotationCategory} />

            <ListItemText
              id={unknownAnnotationCategory.id}
              primary={t(unknownAnnotationCategory.name)}
              primaryTypographyProps={{ noWrap: true }}
            />
            {categoryCounts[unknownAnnotationCategory.id] !== 0 && (
              <Chip
                label={categoryCounts[unknownAnnotationCategory.id]}
                size="small"
              />
            )}
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={(event) =>
                  onCategoryMenuOpen(event, unknownAnnotationCategory)
                }
              >
                <MoreHorizIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>

          <CategoryMenu
            anchorElCategoryMenu={anchorEl}
            onCloseCategoryMenu={onCategoryMenuClose}
            onOpenCategoryMenu={(event) =>
              onCategoryMenuOpen(event, unknownAnnotationCategory)
            }
            onOpenDeleteCategoryDialog={onOpenDeleteCategoryDialog}
            onOpenEditCategoryDialog={onOpenEditCategoryDialog}
            openCategoryMenu={Boolean(anchorEl)}
            onOpenClearCategoryDialog={onOpenClearCategoryDialog}
          />
        </div>
      )}

      {createdCategories.map((category: Category, idx: number) => {
        return (
          <div key={idx}>
            <ListItem
              button
              id={String(idx)}
              onClick={(event) => onCategoryClick(event, category)}
              selected={category.id === selectedCategory.id}
            >
              <CategoryListItemCheckbox category={category} />

              <ListItemText
                id={String(idx)}
                primary={category.name}
                primaryTypographyProps={{ noWrap: true }}
              />
              {categoryCounts[category.id] !== 0 && (
                <Chip label={categoryCounts[category.id]} size="small" />
              )}

              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={(event) => onCategoryMenuOpen(event, category)}
                >
                  <MoreHorizIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>

            <CategoryMenu
              anchorElCategoryMenu={anchorEl}
              onCloseCategoryMenu={onCategoryMenuClose}
              onOpenCategoryMenu={(event) =>
                onCategoryMenuOpen(event, category)
              }
              onOpenDeleteCategoryDialog={onOpenDeleteCategoryDialog}
              onOpenEditCategoryDialog={onOpenEditCategoryDialog}
              onOpenClearCategoryDialog={onOpenClearCategoryDialog}
              openCategoryMenu={Boolean(anchorEl)}
            />
          </div>
        );
      })}

      <DeleteCategoryDialog
        onClose={onCloseDeleteCategoryDialog}
        open={openDeleteCategoryDialog}
      />

      <EditCategoryDialog
        onCloseDialog={onCloseEditCategoryDialog}
        openDialog={openEditCategoryDialog}
      />

      <ClearCategoryDialog
        onClose={onCloseClearCategoryDialog}
        open={openClearCategoryDialog}
      />

      <CreateCategoryListItem />
      <DeleteAllCategoriesListItem
        onOpenDeleteAllCategoriesDialog={onOpenDeleteAllCategoriesDialog}
      />
      <DeleteAllCategoriesDialog
        onClose={onCloseDeleteAllCategoriesDialog}
        open={openDeleteAllCategoriesDialog}
      />
    </CollapsibleList>
  );
};

export default CategoriesList;
