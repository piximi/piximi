import { CollapsibleList } from "./CollapsibleList";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import AddIcon from "@material-ui/icons/Add";
import React from "react";
import { CreateCategoryDialog } from "./CreateCategoryDialog";
import { useSelector } from "react-redux";
import { CategoryListItem } from "./CategoryListItem";
import { Category } from "./types/Category";
import { createdCategoriesSelector } from "./store/selectors/createdCategoriesSelector";
import { unknownCategorySelector } from "./store/selectors/unknownCategorySelector";

export const CategoriesList = () => {
  const categories = useSelector(createdCategoriesSelector);

  const unknownCategory = useSelector(unknownCategorySelector);

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
            return <CategoryListItem category={category} key={category.id} />;
          })}
          <CategoryListItem
            category={unknownCategory}
            key={unknownCategory.id}
          />
        </React.Fragment>
        <ListItem button onClick={onOpenCreateCategoryDialog}>
          <ListItemIcon>
            <AddIcon />
          </ListItemIcon>

          <ListItemText primary="Create category" />
        </ListItem>
      </CollapsibleList>

      <CreateCategoryDialog
        onClose={onCloseCreateCategoryDialog}
        open={openCreateCategoryDialog}
      />
    </React.Fragment>
  );
};
