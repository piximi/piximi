import { CollapsibleList } from "./CollapsibleList";
import { Category } from "./store";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import AddIcon from "@material-ui/icons/Add";
import React from "react";
import { CreateCategoryDialog } from "./CreateCategoryDialog";
import { useSelector } from "react-redux";
import { CategoryListItem } from "./CategoryListItem";
import Checkbox from "@material-ui/core/Checkbox";
import LabelIcon from "@material-ui/icons/Label";
import LabelOutlinedIcon from "@material-ui/icons/LabelOutlined";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import { categoriesSelector } from "./store/selectors";

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
            return <CategoryListItem category={category} key={category.id} />;
          })}

          <ListItem
            dense
            key="00000000-0000-0000-0000-000000000000"
            id="00000000-0000-0000-0000-000000000000"
          >
            <ListItemIcon>
              <Checkbox
                checked
                checkedIcon={<LabelIcon style={{ color: "#AAAAAA" }} />}
                disableRipple
                edge="start"
                icon={<LabelOutlinedIcon style={{ color: "#AAAAAA" }} />}
                tabIndex={-1}
              />
            </ListItemIcon>

            <ListItemText
              id="00000000-0000-0000-0000-000000000000"
              primary="Unknown"
            />

            <ListItemSecondaryAction>
              <IconButton edge="end">
                <MoreHorizIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
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
