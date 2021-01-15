import Drawer from "@material-ui/core/Drawer";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import React from "react";
import { Category } from "../../../types/Category";
import {
  createdCategoriesSelector,
  unknownCategorySelector,
} from "../../../store/selectors";
import { useSelector } from "react-redux";
import { useStyles } from "./Categories.css";
import { CollapsibleList } from "../../CollapsibleList";
import { CreateCategoryListItem } from "../../CreateCategoryListItem";
import { CategoryListItemCheckbox } from "../../CategoryListItemCheckbox";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import { CategoryMenu } from "../../CategoryMenu";
import { DeleteCategoryDialog } from "../../DeleteCategoryDialog";
import { EditCategoryDialog } from "../../EditCategoryDialog";
import { useDialog, useMenu } from "../../../hooks";

type CategoriesProps = {
  activeCategory: Category;
  onCategoryClick: (
    event: React.MouseEvent<HTMLDivElement>,
    category: Category
  ) => void;
};

export const Categories = ({
  activeCategory,
  onCategoryClick,
}: CategoriesProps) => {
  const classes = useStyles();

  const categories = useSelector(createdCategoriesSelector);
  const unknownCategory = useSelector(unknownCategorySelector);

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

  return (
    <Drawer
      anchor="left"
      className={classes.applicationDrawer}
      classes={{ paper: classes.applicationDrawerPaper }}
      open
      variant="persistent"
    >
      <div className={classes.applicationDrawerHeader} />

      <CollapsibleList primary="Categories">
        {categories.map((category: Category) => {
          return (
            <React.Fragment>
              <ListItem
                button
                dense
                id={category.id}
                key={category.id}
                onClick={(event) => onCategoryClick(event, category)}
                selected={category.id === activeCategory.id}
              >
                <CategoryListItemCheckbox category={category} />

                <ListItemText
                  id={category.id}
                  primary={category.name}
                  primaryTypographyProps={{ noWrap: true }}
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
            </React.Fragment>
          );
        })}

        <ListItem
          button
          dense
          id={unknownCategory.id}
          key={unknownCategory.id}
          onClick={(event) => onCategoryClick(event, unknownCategory)}
          selected={unknownCategory.id === activeCategory.id}
        >
          <CategoryListItemCheckbox category={unknownCategory} />

          <ListItemText
            id={unknownCategory.id}
            primary={unknownCategory.name}
            primaryTypographyProps={{ noWrap: true }}
          />
        </ListItem>

        <CreateCategoryListItem />
      </CollapsibleList>
    </Drawer>
  );
};
