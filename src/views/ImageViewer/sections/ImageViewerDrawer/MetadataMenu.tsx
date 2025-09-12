import React from "react";
import { useDispatch, useSelector } from "react-redux";
// import JSZip from "jszip";
import { Divider, Menu, MenuList, MenuItem, Typography } from "@mui/material";

import { useTranslation } from "hooks";

import { ExportAnnotationsMenu } from "../../components";

import { ImageViewerMetadataDetails } from "views/ImageViewer/state/image-viewer-data/types";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import { dataSlice } from "store/data";

type MetadataMenuProps = {
  anchorElImageMenu: any;
  selectedMetadata: ImageViewerMetadataDetails;
  annotationIds: string[];
  onCloseImageMenu: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  openImageMenu: boolean;
};

export const MetadataMenu = ({
  anchorElImageMenu,
  annotationIds,
  selectedMetadata,
  onCloseImageMenu,
  openImageMenu,
}: MetadataMenuProps) => {
  const dispatch = useDispatch();

  const handleClearAnnotations = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
  ) => {
    if (!selectedMetadata) return;
    dispatch(
      imageViewerDataSlice.actions.removeActiveAnnotationIds(annotationIds),
    );
    dispatch(dataSlice.actions.batchDeleteAnnotations(annotationIds));

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
            selectedMetadata={selectedMetadata}
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
