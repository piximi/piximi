import React from "react";
import { useDispatch, useSelector } from "react-redux";
// import JSZip from "jszip";
import { Divider, Menu, MenuList, MenuItem, Typography } from "@mui/material";

import { useTranslation } from "hooks";

import { ExportAnnotationsMenu } from "../../components/ExportAnnotationsMenu";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";

import { ImageObject } from "store/data/types";

type ImageMenuProps = {
  anchorElImageMenu: any;
  selectedImage: ImageObject;
  onCloseImageMenu: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  openImageMenu: boolean;
};

export const ImageMenu = ({
  anchorElImageMenu,
  selectedImage,
  onCloseImageMenu,
  openImageMenu,
}: ImageMenuProps) => {
  const dispatch = useDispatch();
  const annotationDict = useSelector(selectImageViewerObjects);

  const handleClearAnnotations = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
  ) => {
    if (!selectedImage) return;
    dispatch(
      imageViewerSlice.actions.removeActiveAnnotationIds({
        annotationIds: selectedImage.containing,
      }),
    );
    dispatch(
      annotatorSlice.actions.deleteThings({
        thingIds: selectedImage.containing,
      }),
    );

    onCloseImageMenu(event);
  };

  const t = useTranslation();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLLIElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Menu
      anchorEl={anchorElImageMenu}
      anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
      // getContentAnchorEl={null}
      onClose={onCloseImageMenu}
      open={openImageMenu}
      transformOrigin={{ horizontal: "center", vertical: "top" }}
    >
      <MenuList dense variant="menu">
        <div>
          <MenuItem onClick={handleClick}>Export annotations as</MenuItem>
          <ExportAnnotationsMenu
            anchorEl={anchorEl}
            onClose={handleClose}
            open={Boolean(anchorEl)}
            selectedImage={selectedImage}
          />

          <Divider />
          <MenuItem onClick={handleClearAnnotations}>
            <Typography variant="inherit">{t("Clear Annotations")}</Typography>
          </MenuItem>
        </div>
      </MenuList>
    </Menu>
  );
};
