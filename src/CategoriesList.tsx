import { CollapsibleList } from "./CollapsibleList";
import { categoriesSelector, Category } from "./store";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import AddIcon from "@material-ui/icons/Add";
import React from "react";
import { CreateCategoryDialog } from "./CreateCategoryDialog";
import { useSelector } from "react-redux";
import { CategoryListItem } from "./CategoryListItem";

export const CategoriesList = () => {
  const categories = useSelector(categoriesSelector);

  const [
    openCreateCategoryDialog,
    setOpenCreateCategoryDialog,
  ] = React.useState(false);

  const onOpenCreateCategoryDialog = () => {
    setOpenCreateCategoryDialog(true);
  };

  const onCloseCreateCategoryDialog = () => {
    setOpenCreateCategoryDialog(false);
  };

  return (
    <React.Fragment>
      <CollapsibleList primary="Categories">
        <React.Fragment>
          {categories.map((category: Category) => {
            return <CategoryListItem category={category} />;
          })}

          <ListItem button onClick={onOpenCreateCategoryDialog}>
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>

            <ListItemText primary="Create category" />
          </ListItem>
        </React.Fragment>
      </CollapsibleList>

      <CreateCategoryDialog
        onClose={onCloseCreateCategoryDialog}
        open={openCreateCategoryDialog}
      />
    </React.Fragment>
  );
};
