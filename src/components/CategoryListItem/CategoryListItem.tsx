import React from "react";
import { Category } from "../../types/Category";
import { CategoryListItemCheckbox } from "../CategoryListItemCheckbox";
import { CategoryMenu } from "../CategoryMenu";
import { useDialog, useMenu } from "../../hooks";
import { useSelector } from "react-redux";
import { EditCategoryDialog } from "../EditCategoryDialog";
import { DeleteCategoryDialog } from "../DeleteCategoryDialog";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { State } from "../../types/State";
import { Image } from "../../types/Image";
import { useStyles } from "../Application/Application.css";
import {
  Chip,
  IconButton,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";

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
    return state.project.images.filter((image: Image) => {
      return image.categoryId === category.id;
    }).length;
  });

  const classes = useStyles();

  return (
    <>
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
          className={classes.chip}
          style={{ backgroundColor: category.color }}
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
        onCloseDialog={onCloseEditCategoryDialog}
        openDialog={openEditCategoryDialog}
      />
    </>
  );
};
