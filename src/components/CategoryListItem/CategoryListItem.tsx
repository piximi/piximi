import React from "react";
import { useSelector } from "react-redux";

import {
  Chip,
  IconButton,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import { useDialog, useMenu } from "hooks";

import { CategoryListItemCheckbox } from "components/CategoryListItemCheckbox";
import { CategoryMenu } from "components/CategoryMenu";
import { EditCategoryDialog } from "components/EditCategoryDialog";
import { DeleteCategoryDialog } from "components/DeleteCategoryDialog";

import { Category } from "types/Category";
import { State } from "types/State";
import { ImageType } from "types/ImageType";

type CategoryListItemProps = {
  category: Category;
  id: string;
};

export const CategoryListItem = ({ category, id }: CategoryListItemProps) => {
  const {
    onClose: onCloseDeleteCategoryDialog,
    onOpen: onOpenDeleteCategoryDialog,
    open: openDeleteCategoryDialog,
  } = useDialog();
  const {
    onClose: onCloseEditCategoryDialog,
    onOpen: onOpenEditCategoryDialog,
    open: openEditCategoryDialog,
  } = useDialog();

  const {
    anchorEl: anchorElCategoryMenu,
    onClose: onCloseCategoryMenu,
    onOpen: onOpenCategoryMenu,
    open: openCategoryMenu,
  } = useMenu();

  const imageCount = useSelector((state: State) => {
    return state.project.images.filter((image: ImageType) => {
      return image.categoryId === category.id;
    }).length;
  });

  return (
    <React.Fragment>
      <ListItem dense key={id} id={id}>
        <CategoryListItemCheckbox category={category} />

        <ListItemText
          id={id}
          primary={category.name}
          primaryTypographyProps={{ noWrap: true }}
        />

        <Chip
          label={imageCount}
          size="small"
          // className={classes.chip}
          sx={{
            height: "20px",
            borderWidth: "2px",
            fontSize: "0.875rem",
            color: "white",
            backgroundColor: category.color,
          }}
        />

        <ListItemSecondaryAction>
          <IconButton edge="end" onClick={onOpenCategoryMenu}>
            <MoreHorizIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>

      <CategoryMenu
        anchorElCategoryMenu={anchorElCategoryMenu}
        category={category}
        onCloseCategoryMenu={onCloseCategoryMenu}
        onOpenCategoryMenu={onOpenCategoryMenu}
        onOpenDeleteCategoryDialog={onOpenDeleteCategoryDialog}
        onOpenEditCategoryDialog={onOpenEditCategoryDialog}
        openCategoryMenu={openCategoryMenu}
      />

      <DeleteCategoryDialog
        category={category}
        onClose={onCloseDeleteCategoryDialog}
        open={openDeleteCategoryDialog}
      />

      <EditCategoryDialog
        category={category}
        onClose={onCloseEditCategoryDialog}
        open={openEditCategoryDialog}
      />
    </React.Fragment>
  );
};
