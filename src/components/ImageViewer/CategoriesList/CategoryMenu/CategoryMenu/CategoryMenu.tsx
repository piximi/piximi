import React from "react";
import Menu from "@mui/material/Menu";
import MenuList from "@mui/material/MenuList";
import Divider from "@mui/material/Divider";
import { HideOrShowCategoryMenuItem } from "../HideOrShowCategoryMenuItem";
import { HideOtherCategoriesMenuItem } from "../HideOtherCategoriesMenuItem";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { batch, useDispatch, useSelector } from "react-redux";
import { imagesSelector } from "../../../../../store/selectors/imagesSelector";
import { selectedCategorySelector } from "../../../../../store/selectors";
import { imageViewerSlice, projectSlice } from "../../../../../store/slices";

type CategoryMenuProps = {
  anchorElCategoryMenu: any;
  onCloseCategoryMenu: (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => void;
  onOpenCategoryMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  openCategoryMenu: boolean;
  onOpenDeleteCategoryDialog: () => void;
  onOpenEditCategoryDialog: () => void;
  onOpenClearCategoryDialog: () => void;
};

export const CategoryMenu = ({
  anchorElCategoryMenu,
  onCloseCategoryMenu,
  openCategoryMenu,
  onOpenDeleteCategoryDialog,
  onOpenEditCategoryDialog,
  onOpenClearCategoryDialog,
}: CategoryMenuProps) => {
  const images = useSelector(imagesSelector);

  const dispatch = useDispatch();

  const category = useSelector(selectedCategorySelector);

  const onOpenDeleteCategoryDialogClick = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    //cycle through the annotations to determine if annotations of that category exist
    // show a warning dialog box is they do exist
    let existAnnotations = false;
    for (let i = 0; i < images.length; i++) {
      if (!existAnnotations) {
        for (let j = 0; j < images[i].annotations.length; j++) {
          if (images[i].annotations[j].categoryId === category.id) {
            existAnnotations = true;
          }
        }
      }
    }
    if (existAnnotations) {
      onOpenDeleteCategoryDialog();
    } //warn user that these annotations will be relabeled as unknown
    else {
      batch(() => {
        dispatch(
          imageViewerSlice.actions.setSelectedCategory({
            selectedCategory: "00000000-0000-0000-0000-000000000000",
          })
        );

        dispatch(projectSlice.actions.deleteCategory({ id: category.id }));
      });
    }
    onCloseCategoryMenu(event);
  };

  const onOpenEditCategoryDialogClick = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    onOpenEditCategoryDialog();
    onCloseCategoryMenu(event);
  };

  const onOpenClearCategoryDialogClick = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    onOpenClearCategoryDialog();
    onCloseCategoryMenu(event);
  };

  const t = useTranslation();

  return (
    <Menu
      anchorEl={anchorElCategoryMenu}
      anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
      onClose={onCloseCategoryMenu}
      open={openCategoryMenu}
      transformOrigin={{ horizontal: "center", vertical: "top" }}
    >
      <MenuList dense variant="menu">
        <HideOtherCategoriesMenuItem
          onCloseCategoryMenu={onCloseCategoryMenu}
        />

        <HideOrShowCategoryMenuItem
          category={category}
          onCloseCategoryMenu={onCloseCategoryMenu}
        />

        <div>
          <Divider />

          <MenuItem onClick={onOpenEditCategoryDialogClick}>
            <Typography variant="inherit">{t("Edit category")}</Typography>
          </MenuItem>
        </div>
        <MenuItem onClick={onOpenClearCategoryDialogClick}>
          <Typography variant="inherit">{t("Clear Annotations")}</Typography>
        </MenuItem>

        {category.id !== "00000000-0000-0000-0000-000000000000" && (
          <MenuItem onClick={onOpenDeleteCategoryDialogClick}>
            <Typography variant="inherit">{t("Delete category")}</Typography>
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  );
};
