import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Menu, MenuItem, MenuList, PopoverReference } from "@mui/material";
import LabelIcon from "@mui/icons-material/Label";

import { applicationSlice } from "store/application";
import {
  dataSlice,
  selectAllAnnotationCategories,
  selectAllImageCategories,
} from "store/data";

import { Category } from "types";
import { projectSlice, selectImageGridTab } from "store/project";

type ImageCategoryMenuProps = {
  anchorEl?: HTMLElement;
  selectedIds: Array<string>;
  onClose: () => void;
  anchorReference?: PopoverReference;
  anchorPosition?: { top: number; left: number };
  open: boolean;
  container?: Element | null;
};

export const ImageCategoryMenu = ({
  anchorEl,
  selectedIds,
  onClose,
  anchorReference,
  anchorPosition,
  open,
  container,
}: ImageCategoryMenuProps) => {
  const imageCategories = useSelector(selectAllImageCategories);
  const annotationCategories = useSelector(selectAllAnnotationCategories);
  const imageGridTab = useSelector(selectImageGridTab);

  const dispatch = useDispatch();

  const onClick = (
    event: React.MouseEvent<HTMLLIElement>,
    categoryId: string
  ) => {
    onClose();

    if (imageGridTab === "Images") {
      dispatch(
        dataSlice.actions.updateImageCategories({
          imageIds: selectedIds,
          categoryId: categoryId,
        })
      );
      dispatch(applicationSlice.actions.clearSelectedImages());
    } else {
      dispatch(
        dataSlice.actions.updateAnnotationCategories({
          annotationIds: selectedIds,
          categoryId: categoryId,
        })
      );
      dispatch(
        projectSlice.actions.setSelectedAnnotations({ annotationIds: [] })
      );
    }
  };

  return (
    <Menu
      anchorReference={anchorReference}
      anchorPosition={anchorPosition}
      anchorOrigin={{
        horizontal: "center",
        vertical: "bottom",
      }}
      transformOrigin={{
        horizontal: "center",
        vertical: "top",
      }}
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      container={container}
    >
      <MenuList dense variant="menu">
        {(imageGridTab === "Images"
          ? imageCategories
          : annotationCategories
        ).map((category: Category) => (
          <MenuItem
            key={category.id}
            onClick={(event: any) => onClick(event, category.id)}
          >
            <LabelIcon style={{ color: category.color, paddingRight: "8px" }} />
            {category.name}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};
