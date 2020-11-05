import React from "react";
import Menu from "@material-ui/core/Menu";
import MenuList from "@material-ui/core/MenuList";
import Divider from "@material-ui/core/Divider";
import { Category } from "../../../../../../types/Category";
import { EditCategoryMenuItem } from "../EditCategoryMenuItem";
import { DeleteCategoryMenuItem } from "../DeleteCategoryMenuItem";
import { HideOrShowCategoryMenuItem } from "../HideOrShowCategoryMenuItem";
import { HideOtherCategoriesMenuItem } from "../HideOtherCategoriesMenuItem";

type CategoryMenuProps = {
  anchorElCategoryMenu: any;
  category: Category;
  onCloseCategoryMenu: () => void;
  onOpenCategoryMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  openCategoryMenu: boolean;
};

export const CategoryMenu = ({
  anchorElCategoryMenu,
  category,
  onCloseCategoryMenu,
  openCategoryMenu,
}: CategoryMenuProps) => {
  return (
    <Menu
      anchorEl={anchorElCategoryMenu}
      anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
      getContentAnchorEl={null}
      onClose={onCloseCategoryMenu}
      open={openCategoryMenu}
      transformOrigin={{ horizontal: "center", vertical: "top" }}
    >
      <MenuList dense variant="menu">
        <HideOtherCategoriesMenuItem
          category={category}
          onCloseCategoryMenu={onCloseCategoryMenu}
        />

        <HideOrShowCategoryMenuItem
          category={category}
          onCloseCategoryMenu={onCloseCategoryMenu}
        />

        <Divider />

        <EditCategoryMenuItem
          category={category}
          onCloseCategoryMenu={onCloseCategoryMenu}
        />

        <DeleteCategoryMenuItem
          category={category}
          onCloseCategoryMenu={onCloseCategoryMenu}
        />
      </MenuList>
    </Menu>
  );
};
