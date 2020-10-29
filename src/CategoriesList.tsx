import { CollapsibleList } from "./CollapsibleList";
import { Category, State } from "./store";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Checkbox from "@material-ui/core/Checkbox";
import LabelIcon from "@material-ui/icons/Label";
import LabelOutlinedIcon from "@material-ui/icons/LabelOutlined";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import AddIcon from "@material-ui/icons/Add";
import React from "react";
import Menu from "@material-ui/core/Menu";
import MenuList from "@material-ui/core/MenuList";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import { CreateCategoryDialog } from "./CreateCategoryDialog";
import { useSelector } from "react-redux";
import { EditCategoryDialog } from "./EditCategoryDialog";

export const CategoriesList = () => {
  const categories = useSelector((state: State) => {
    return state.project.categories;
  });

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

type CategoryListItemProps = {
  category: Category;
};

const CategoryListItem = ({ category }: CategoryListItemProps) => {
  const [openEditCategoryDialog, setOpenEditCategoryDialog] = React.useState(
    false
  );

  const onOpenEditCategoryDialog = () => {
    onCloseCategoryMenu();
    setOpenEditCategoryDialog(true);
    setCategoryMenuAnchorEl(null);
  };

  const [
    categoryMenuAnchorEl,
    setCategoryMenuAnchorEl,
  ] = React.useState<null | HTMLElement>(null);

  const onOpenCategoryMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    category: Category
  ) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };

  const onCloseEditCategoryDialog = () => {
    setOpenEditCategoryDialog(false);
  };

  return (
    <React.Fragment>
      <ListItem dense key={category.id} id={category.id}>
        <ListItemIcon>
          <Checkbox
            checked
            checkedIcon={<LabelIcon style={{ color: category.color }} />}
            disableRipple
            edge="start"
            icon={<LabelOutlinedIcon style={{ color: category.color }} />}
            tabIndex={-1}
          />
        </ListItemIcon>

        <ListItemText id={category.id} primary={category.name} />

        <ListItemSecondaryAction>
          <IconButton
            edge="end"
            onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
              onOpenCategoryMenu(event, category)
            }
          >
            <MoreHorizIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>

      <Menu
        anchorEl={categoryMenuAnchorEl}
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        getContentAnchorEl={null}
        onClose={onCloseCategoryMenu}
        open={Boolean(categoryMenuAnchorEl)}
        transformOrigin={{ horizontal: "center", vertical: "top" }}
      >
        <MenuList dense variant="menu">
          <MenuItem onClick={onCloseCategoryMenu}>
            <Typography variant="inherit">Hide other categories</Typography>
          </MenuItem>

          <MenuItem onClick={onCloseCategoryMenu}>
            <Typography variant="inherit">Hide category</Typography>
          </MenuItem>

          <Divider />

          <MenuItem onClick={onOpenEditCategoryDialog}>
            <Typography variant="inherit">Edit category</Typography>
          </MenuItem>

          <MenuItem onClick={onCloseCategoryMenu}>
            <Typography variant="inherit">Delete category</Typography>
          </MenuItem>
        </MenuList>
      </Menu>

      <EditCategoryDialog
        category={category}
        onClose={onCloseEditCategoryDialog}
        open={openEditCategoryDialog}
      />
    </React.Fragment>
  );
};
