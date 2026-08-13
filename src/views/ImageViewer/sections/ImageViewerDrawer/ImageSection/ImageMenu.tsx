import { useState } from "react";

import { useDispatch } from "react-redux";

// import JSZip from "jszip";
import { Divider, Menu, MenuList, MenuItem, Typography } from "@mui/material";

import { useTranslation } from "hooks";

import type { ExtendedImageObject } from "store/data/types";
import { imageViewerDataSlice } from "@ImageViewer/state/image-viewer-data/imageViewerDataSlice";
import { selectAnnotationsByImageId } from "store/data/selectors";
import { useParameterizedSelector } from "store/hooks";

import { ExportAnnotationsMenu } from "../../../components";

type ImageMenuProps = {
  anchorElImageMenu: any;
  selectedImage: ExtendedImageObject;
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

  const annotations = useParameterizedSelector(
    selectAnnotationsByImageId,
    selectedImage.id,
  );

  const handleClearAnnotations = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
  ) => {
    if (!selectedImage) return;
    dispatch(
      imageViewerDataSlice.actions.removeActiveAnnotationIds(
        annotations.map((ann) => ann.id),
      ),
    );

    onCloseImageMenu(event);
  };

  const t = useTranslation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
