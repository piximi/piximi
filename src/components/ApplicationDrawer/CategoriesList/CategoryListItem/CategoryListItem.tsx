import React from "react";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Checkbox from "@material-ui/core/Checkbox";
import LabelIcon from "@material-ui/icons/Label";
import LabelOutlinedIcon from "@material-ui/icons/LabelOutlined";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import { Category } from "../../../../types/Category";
import { useDispatch } from "react-redux";
import { projectSlice } from "../../../../store/slices";
import { CategoryMenu } from "../CategoryMenu";
import { useMenu } from "../../../../hooks";

type CategoryListItemProps = {
  category: Category;
};

export const CategoryListItem = ({ category }: CategoryListItemProps) => {
  const dispatch = useDispatch();

  const {
    anchorEl: anchorElCategoryMenu,
    onClose: onCloseCategoryMenu,
    onOpen: onOpenCategoryMenu,
    open: openCategoryMenu,
  } = useMenu();

  const onToggleCategory = (category: Category) => {
    onCloseCategoryMenu();
    const visible = !category.visible;
    dispatch(
      projectSlice.actions.updateCategoryVisibilityAction({
        id: category.id,
        visible: visible,
      })
    );
  };

  return (
    <React.Fragment>
      <ListItem dense key={category.id} id={category.id}>
        <ListItemIcon>
          <Checkbox
            checked={category.visible}
            checkedIcon={<LabelIcon style={{ color: category.color }} />}
            disableRipple
            edge="start"
            icon={<LabelOutlinedIcon style={{ color: category.color }} />}
            tabIndex={-1}
            onChange={() => onToggleCategory(category)}
          />
        </ListItemIcon>

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
