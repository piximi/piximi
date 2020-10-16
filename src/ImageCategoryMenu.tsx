import React from "react";
import Menu from "@material-ui/core/Menu";
import { bindMenu, PopupState } from "material-ui-popup-state/hooks";
import MenuList from "@material-ui/core/MenuList";
import { Category, State } from "./store";
import MenuItem from "@material-ui/core/MenuItem";
import { useSelector } from "react-redux";

type ImageCategoryMenuProps = {
  menu: PopupState;
};

export const ImageCategoryMenu = ({ menu }: ImageCategoryMenuProps) => {
  const categories = useSelector((state: State) => {
    return state.project.categories;
  });

  return (
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
      {...bindMenu(menu)}
    >
      <MenuList dense variant="menu">
        {categories.map((category: Category) => (
          <MenuItem key={category.id} onClick={menu.close}>
            {category.name}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};
