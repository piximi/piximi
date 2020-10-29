import React from "react";
import Menu from "@material-ui/core/Menu";
import MenuList from "@material-ui/core/MenuList";
import { Category, ProjectState, updateImageCategoryAction } from "./store";
import MenuItem from "@material-ui/core/MenuItem";
import { useDispatch, useSelector } from "react-redux";
import { Image } from "./store";

type ImageCategoryMenuProps = {
  anchorEl: HTMLElement;
  image: Image;
  onClose: () => void;
};

export const ImageCategoryMenu = ({
  anchorEl,
  image,
  onClose,
}: ImageCategoryMenuProps) => {
  const categories = useSelector((state: ProjectState) => {
    return state.project.categories;
  });

  const dispatch = useDispatch();

  const onClick = (
    event: React.MouseEvent<HTMLLIElement>,
    categoryId: string
  ) => {
    onClose();

    dispatch(
      updateImageCategoryAction({ id: image.id, categoryId: categoryId })
    );
  };

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
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
    >
      <MenuList dense variant="menu">
        {categories.map((category: Category) => (
          <MenuItem
            key={category.id}
            onClick={(event) => onClick(event, category.id)}
          >
            {category.name}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};
