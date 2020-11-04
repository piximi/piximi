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
import Menu from "@material-ui/core/Menu";
import MenuList from "@material-ui/core/MenuList";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import { EditCategoryDialog } from "./EditCategoryDialog";
import { Category } from "./types/Category";
import { useDispatch } from "react-redux";
import { projectSlice } from "./store/slices";

type CategoryListItemProps = {
  category: Category;
};

export const CategoryListItem = ({ category }: CategoryListItemProps) => {
  const dispatch = useDispatch();

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

  // const [categoryVisible, setCategoryVisible] = React.useState(true);

  const onToggleCategory = (
    event: React.ChangeEvent<HTMLInputElement>,
    category: Category
  ) => {
    const visible = !category.visible;
    dispatch(
      projectSlice.actions.updateCategoryVisibilityAction({
        id: category.id,
        visible: visible,
      })
    );
  };

  const onMenuToggleCategory = (
    event: React.MouseEvent<HTMLElement>,
    category: Category
  ) => {
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
            onChange={(event) => onToggleCategory(event, category)}
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

          <MenuItem
            onClick={(event: React.MouseEvent<HTMLElement>) =>
              onMenuToggleCategory(event, category)
            }
          >
            <Typography variant="inherit">
              {category.visible ? "Hide" : "Show"} category
            </Typography>
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
