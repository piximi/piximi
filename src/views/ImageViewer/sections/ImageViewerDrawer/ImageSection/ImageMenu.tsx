import { useDispatch } from "react-redux";

// import JSZip from "jszip";
import { Menu, MenuList, MenuItem, Typography } from "@mui/material";

import { useTranslation } from "hooks";

import { selectAnnotationsByImageId } from "store/data/selectors";
import { useParameterizedSelector } from "store/hooks";

import { imageViewerDataSlice } from "@ImageViewer/state/imageViewerData";

import type { ExtendedImageObject } from "core/entities";

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
          <MenuItem onClick={handleClearAnnotations}>
            <Typography variant="inherit">{t("Clear Annotations")}</Typography>
          </MenuItem>
        </div>
      </MenuList>
    </Menu>
  );
};
