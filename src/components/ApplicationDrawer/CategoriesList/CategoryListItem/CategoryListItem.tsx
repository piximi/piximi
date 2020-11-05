import React from "react";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import { Category } from "../../../../types/Category";
import { CategoryMenu } from "../CategoryMenu";
import { useMenu } from "../../../../hooks";
import { CategoryListItemCheckbox } from "../CategoryListItemCheckbox";

type CategoryListItemProps = {
  category: Category;
};

export const CategoryListItem = ({ category }: CategoryListItemProps) => {
  const {
    anchorEl: anchorElCategoryMenu,
    onClose: onCloseCategoryMenu,
    onOpen: onOpenCategoryMenu,
    open: openCategoryMenu,
  } = useMenu();

  return (
    <React.Fragment>
      <ListItem dense key={category.id} id={category.id}>
        <CategoryListItemCheckbox category={category} />

        <ListItemText id={category.id} primary={category.name} />

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
        openCategoryMenu={openCategoryMenu}
      />
    </React.Fragment>
  );
};
