import * as React from "react";
import * as MaterialUI from "@material-ui/core";
import {Project, Category} from "@piximi/types";

type HideOtherCategoriesProps = {
  project: Project;
  categoryProp: Category;
  closeMenu: () => void;
  makeCategoryInvisible: (category: Category, visible: boolean) => void;
};

export const HideOtherCategoriesMenuItem = (
  props: HideOtherCategoriesProps
) => {
  const {project, categoryProp, closeMenu, makeCategoryInvisible} = props;

  // check if 'categoryProp' is the only visible category
  const isOnlyVisibleCategory =
    project.categories
      .filter(
        (category: Category) => category.identifier !== categoryProp.identifier
      )
      .filter((category: Category) => category.visualization.visible).length ===
    0;

  const listItemText = isOnlyVisibleCategory
    ? "Show other categories"
    : "Hide other categories";

  const onClick = () => {
    closeMenu();
    project.categories.forEach((category: Category) => {
      if (category.identifier !== categoryProp.identifier) {
        makeCategoryInvisible(category, isOnlyVisibleCategory);
      }
    });
  };

  return (
    <MaterialUI.MenuItem onClick={onClick}>
      <MaterialUI.ListItemText primary={listItemText} />
    </MaterialUI.MenuItem>
  );
};
