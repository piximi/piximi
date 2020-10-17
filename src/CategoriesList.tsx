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
import {
  bindMenu,
  bindTrigger,
  usePopupState,
} from "material-ui-popup-state/hooks";
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

export const CategoriesList = () => {
  const categories = useSelector((state: State) => {
    return state.project.categories;
  });

  const categoryMenu = usePopupState({
    popupId: "category-menu",
    variant: "popover",
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
    <>
      <CollapsibleList primary="Categories">
        <>
          {categories.map((category: Category) => {
            return (
              <ListItem dense key={category.id}>
                <ListItemIcon>
                  <Checkbox
                    checked
                    checkedIcon={<LabelIcon />}
                    disableRipple
                    edge="start"
                    icon={<LabelOutlinedIcon />}
                    tabIndex={-1}
                  />
                </ListItemIcon>

                <ListItemText id={category.id} primary={category.name} />

                <ListItemSecondaryAction>
                  <IconButton edge="end" {...bindTrigger(categoryMenu)}>
                    <MoreHorizIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}

          <ListItem button onClick={onOpenCreateCategoryDialog}>
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>

            <ListItemText primary="Create category" />
          </ListItem>
        </>
      </CollapsibleList>

      <Menu
        anchorOrigin={{
          horizontal: "center",
          vertical: "bottom",
        }}
        getContentAnchorEl={null}
        transformOrigin={{
          horizontal: "center",
          vertical: "top",
        }}
        {...bindMenu(categoryMenu)}
      >
        <MenuList dense variant="menu">
          <MenuItem onClick={categoryMenu.close}>
            <Typography variant="inherit">Hide other categories</Typography>
          </MenuItem>

          <MenuItem onClick={categoryMenu.close}>
            <Typography variant="inherit">Hide category</Typography>
          </MenuItem>

          <Divider />

          <MenuItem onClick={categoryMenu.close}>
            <Typography variant="inherit">Update category</Typography>
          </MenuItem>

          <MenuItem onClick={categoryMenu.close}>
            <Typography variant="inherit">Delete category</Typography>
          </MenuItem>
        </MenuList>
      </Menu>

      <CreateCategoryDialog
        onClose={onCloseCreateCategoryDialog}
        open={openCreateCategoryDialog}
      />
    </>
  );
};
