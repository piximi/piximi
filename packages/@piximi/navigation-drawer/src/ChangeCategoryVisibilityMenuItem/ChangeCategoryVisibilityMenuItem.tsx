import * as React from "react";
import * as MaterialUI from "@material-ui/core";
import {Category} from "@piximi/types";

type ChangeCategoryVisibilityProps = {
  category: Category;
  closeMenu: () => void;
  makeCategoryInvisible: (category: Category, visibility: boolean) => void;
};

export const ChangeCategoryVisibilityMenuItem = (
  props: ChangeCategoryVisibilityProps
) => {
  const {category, closeMenu, makeCategoryInvisible} = props;

  const categoryIsVisible = category.visualization.visible;

  const listItemText = categoryIsVisible ? "Hide category" : "Show category";

  const onClick = () => {
    closeMenu();
    makeCategoryInvisible(category, !categoryIsVisible);
  };

  return (
    <MaterialUI.MenuItem onClick={onClick}>
      <MaterialUI.ListItemText primary={listItemText} />
    </MaterialUI.MenuItem>
  );
};
